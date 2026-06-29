import math
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from models import LiveLocation, Bus, BusStop
from schemas import ETAResponse, StopETA
from services.bus_location_service import calculate_bus_location, STALE_THRESHOLD_SECONDS


EARTH_RADIUS_KM = 6371.0
DEFAULT_SPEED_KMH = 20.0  # fallback if we can't compute speed
SPEED_WINDOW_SECONDS = 60  # look back this far for speed estimation


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Return great-circle distance in kilometres between two lat/lon points."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * EARTH_RADIUS_KM * math.asin(math.sqrt(a))


def estimate_speed(db: Session, bus_id: int) -> float:
    """
    Estimate average speed (km/h) from recent location changes.

    Strategy: compare the earliest and latest aggregate positions within the
    speed-estimation window and compute distance / time.
    Falls back to DEFAULT_SPEED_KMH when there is not enough data.
    """
    cutoff = datetime.utcnow() - timedelta(seconds=SPEED_WINDOW_SECONDS)
    locations = (
        db.query(LiveLocation)
        .filter(LiveLocation.bus_id == bus_id, LiveLocation.timestamp >= cutoff)
        .order_by(LiveLocation.timestamp)
        .all()
    )

    if len(locations) < 2:
        return DEFAULT_SPEED_KMH

    oldest = locations[0]
    newest = locations[-1]

    time_delta_hours = (newest.timestamp - oldest.timestamp).total_seconds() / 3600
    if time_delta_hours == 0:
        return DEFAULT_SPEED_KMH

    dist = haversine(oldest.latitude, oldest.longitude, newest.latitude, newest.longitude)
    speed = dist / time_delta_hours
    # Clamp to a realistic bus range (5–80 km/h)
    return max(5.0, min(speed, 80.0))


def calculate_eta(db: Session, bus_id: int) -> ETAResponse | None:
    """
    Return ETA for all upcoming stops on the bus's route, ordered by stop_order.
    Only stops *ahead* of the bus (greater stop_order) are included; a simple
    nearest-stop heuristic determines the current position in the route.
    """
    bus_location = calculate_bus_location(db, bus_id)
    if bus_location is None:
        return None

    bus = db.query(Bus).filter(Bus.id == bus_id).first()
    if not bus:
        return None

    stops = (
        db.query(BusStop)
        .filter(BusStop.route_id == bus.route_id)
        .order_by(BusStop.stop_order)
        .all()
    )

    if not stops:
        return None

    speed = estimate_speed(db, bus_id)

    # Find the nearest stop — treat it as already passed / current
    nearest_idx = min(
        range(len(stops)),
        key=lambda i: haversine(
            bus_location.latitude, bus_location.longitude,
            stops[i].latitude, stops[i].longitude,
        ),
    )

    stop_etas: list[StopETA] = []
    cumulative_dist_km = 0.0

    prev_lat = bus_location.latitude
    prev_lon = bus_location.longitude

    for stop in stops[nearest_idx:]:
        dist = haversine(prev_lat, prev_lon, stop.latitude, stop.longitude)
        cumulative_dist_km += dist
        eta_minutes = (cumulative_dist_km / speed) * 60 if speed > 0 else None

        stop_etas.append(
            StopETA(
                stop_id=stop.id,
                stop_name=stop.stop_name,
                latitude=stop.latitude,
                longitude=stop.longitude,
                stop_order=stop.stop_order,
                distance_km=round(cumulative_dist_km, 3),
                eta_minutes=round(eta_minutes, 1) if eta_minutes is not None else None,
            )
        )
        prev_lat, prev_lon = stop.latitude, stop.longitude

    return ETAResponse(
        bus_id=bus.id,
        bus_number=bus.bus_number,
        current_latitude=bus_location.latitude,
        current_longitude=bus_location.longitude,
        average_speed_kmh=round(speed, 1),
        stops=stop_etas,
    )
