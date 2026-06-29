import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from routers import routes_router, location_router, users_router
from websocket.manager import ws_endpoint, broadcast_loop
from seed import seed

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(name)s  %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ────────────────────────────────────────────────────────────────
    logger.info("Creating database tables…")
    Base.metadata.create_all(bind=engine)
    logger.info("Seeding database…")
    seed()
    logger.info("Starting WebSocket broadcast loop…")
    task = asyncio.create_task(broadcast_loop())
    yield
    # ── Shutdown ───────────────────────────────────────────────────────────────
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass
    logger.info("Shutdown complete.")


app = FastAPI(
    title="Where Is My Bus — API",
    description="Crowdsourced real-time bus tracking backend.",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── REST routers ───────────────────────────────────────────────────────────────
app.include_router(routes_router)
app.include_router(location_router)
app.include_router(users_router)


# ── WebSocket ──────────────────────────────────────────────────────────────────
@app.websocket("/ws/route/{route_id}")
async def websocket_route(websocket: WebSocket, route_id: int):
    """
    Subscribe to live bus-position updates for a specific route.
    The server pushes JSON every 5 seconds:
        { "buses": [ { bus_id, bus_number, latitude, longitude, ... } ] }
    """
    await ws_endpoint(websocket, route_id)


# ── Health ─────────────────────────────────────────────────────────────────────
@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok"}
