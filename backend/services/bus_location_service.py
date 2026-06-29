from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from models import LiveLocation, Bus
from schemas import BusLocationResponse, CrowdLevel
from services.crowd_service import get_crowd_level


STALE_THRESHOLD_SECONDS = 30  # ignore locations older than this


def get_active_locations(db: Session, bus_id: int):
    """Return live locations updated within the stale threshold."""
    cutoff = datetime.utcnow() - timedelta(seconds=STALE_THRESHOLD_SECONDS)
    return (
        db.query(LiveLocation)
        .filter(LiveLocation.bus_id == bus_id, LiveLocation.timestamp >= cutoff)
        .all()
    )


def calculate_bus_location(db: Session, bus_id: int) -> BusLocationResponse | None:
    """
    Average the coordinates of all active passengers on a bus to estimate
    the bus's current position.
    """
    bus = db.query(Bus).filter(Bus.id == bus_id).first()
    if not bus:
        return None

    locations = get_active_locations(db, bus_id)

    if not locations:
        return None

    avg_lat = sum(loc.latitude for loc in locations) / len(locations)
    avg_lon = sum(loc.longitude for loc in locations) / len(locations)
    last_updated = max(loc.timestamp for loc in locations)
    passenger_count = len(locations)

    return BusLocationResponse(
        bus_id=bus.id,
        bus_number=bus.bus_number,
        latitude=avg_lat,
        longitude=avg_lon,
        active_passengers=passenger_count,
        crowd_level=get_crowd_level(passenger_count),
        last_updated=last_updated,
    )
