import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, Set

from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from database import SessionLocal
from models import Bus, Route
from services.bus_location_service import calculate_bus_location
from services.crowd_service import get_crowd_level

logger = logging.getLogger(__name__)

BROADCAST_INTERVAL = 5  # seconds


class ConnectionManager:
    """Track active WebSocket connections, optionally filtered by route."""

    def __init__(self):
        # route_id → set of websockets
        self._connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, route_id: int):
        await websocket.accept()
        self._connections.setdefault(route_id, set()).add(websocket)
        logger.info("WS connected  route=%s total=%s", route_id, self.count(route_id))

    def disconnect(self, websocket: WebSocket, route_id: int):
        self._connections.get(route_id, set()).discard(websocket)
        logger.info("WS disconnected route=%s total=%s", route_id, self.count(route_id))

    def count(self, route_id: int) -> int:
        return len(self._connections.get(route_id, set()))

    async def broadcast(self, route_id: int, payload: dict):
        dead: Set[WebSocket] = set()
        for ws in list(self._connections.get(route_id, set())):
            try:
                await ws.send_json(payload)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self._connections.get(route_id, set()).discard(ws)

    @property
    def all_route_ids(self):
        return list(self._connections.keys())


manager = ConnectionManager()


async def ws_endpoint(websocket: WebSocket, route_id: int):
    """
    WebSocket endpoint handler.
    Clients subscribe to a route and receive live bus-position updates.
    """
    await manager.connect(websocket, route_id)
    try:
        while True:
            # Keep connection alive; actual data is pushed by the broadcaster
            await asyncio.wait_for(websocket.receive_text(), timeout=60)
    except (WebSocketDisconnect, asyncio.TimeoutError):
        manager.disconnect(websocket, route_id)


async def broadcast_loop():
    """
    Background task: every BROADCAST_INTERVAL seconds, compute estimated
    positions for all buses on actively-watched routes and push to subscribers.
    """
    while True:
        await asyncio.sleep(BROADCAST_INTERVAL)
        if not manager.all_route_ids:
            continue

        db: Session = SessionLocal()
        try:
            for route_id in manager.all_route_ids:
                if manager.count(route_id) == 0:
                    continue

                buses = db.query(Bus).filter(Bus.route_id == route_id).all()
                route = db.query(Route).filter(Route.id == route_id).first()
                payloads = []

                for bus in buses:
                    loc = calculate_bus_location(db, bus.id)
                    if loc is None:
                        continue
                    payloads.append(
                        {
                            "bus_id": bus.id,
                            "bus_number": bus.bus_number,
                            "route_id": route_id,
                            "latitude": loc.latitude,
                            "longitude": loc.longitude,
                            "active_passengers": loc.active_passengers,
                            "crowd_level": loc.crowd_level.value,
                            "last_updated": loc.last_updated.isoformat()
                            if loc.last_updated
                            else None,
                        }
                    )

                if payloads:
                    await manager.broadcast(route_id, {"buses": payloads})
        except Exception as exc:
            logger.exception("Broadcast error: %s", exc)
        finally:
            db.close()
