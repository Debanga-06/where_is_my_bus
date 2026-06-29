from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Route, Bus, BusStop
from schemas import RouteResponse, BusResponse, BusStopResponse

router = APIRouter(prefix="/routes", tags=["routes"])


@router.get("/", response_model=List[RouteResponse])
def get_routes(db: Session = Depends(get_db)):
    """Return all available bus routes."""
    return db.query(Route).all()


@router.get("/{route_id}/buses", response_model=List[BusResponse])
def get_buses_for_route(route_id: int, db: Session = Depends(get_db)):
    """Return all buses assigned to a specific route."""
    route = db.query(Route).filter(Route.id == route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    return db.query(Bus).filter(Bus.route_id == route_id).all()


@router.get("/{route_id}/stops", response_model=List[BusStopResponse])
def get_stops_for_route(route_id: int, db: Session = Depends(get_db)):
    """Return all stops for a route, ordered by stop_order."""
    route = db.query(Route).filter(Route.id == route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    return (
        db.query(BusStop)
        .filter(BusStop.route_id == route_id)
        .order_by(BusStop.stop_order)
        .all()
    )
