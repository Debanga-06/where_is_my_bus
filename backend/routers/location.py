from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import LiveLocation, User, Bus
from schemas import LocationCreate, LocationResponse, BusLocationResponse, ETAResponse
from services.bus_location_service import calculate_bus_location
from services.eta_service import calculate_eta

router = APIRouter(tags=["location"])


@router.post("/location", response_model=LocationResponse, status_code=201)
def post_location(payload: LocationCreate, db: Session = Depends(get_db)):
    """
    Accept a passenger's GPS coordinates and persist them.
    Called every ~5 seconds by the frontend while the user is riding.
    """
    if not db.query(User).filter(User.id == payload.user_id).first():
        raise HTTPException(status_code=404, detail="User not found")
    if not db.query(Bus).filter(Bus.id == payload.bus_id).first():
        raise HTTPException(status_code=404, detail="Bus not found")

    # Upsert: update the row for this user+bus if it exists, else insert
    existing = (
        db.query(LiveLocation)
        .filter(
            LiveLocation.user_id == payload.user_id,
            LiveLocation.bus_id == payload.bus_id,
        )
        .first()
    )

    if existing:
        existing.latitude = payload.latitude
        existing.longitude = payload.longitude
        db.commit()
        db.refresh(existing)
        return existing

    location = LiveLocation(
        user_id=payload.user_id,
        bus_id=payload.bus_id,
        latitude=payload.latitude,
        longitude=payload.longitude,
    )
    db.add(location)
    db.commit()
    db.refresh(location)
    return location


@router.get("/bus/{bus_id}/location", response_model=BusLocationResponse)
def get_bus_location(bus_id: int, db: Session = Depends(get_db)):
    """Return the estimated bus position derived from active passenger locations."""
    result = calculate_bus_location(db, bus_id)
    if result is None:
        raise HTTPException(
            status_code=404,
            detail="No active passengers on this bus or bus not found",
        )
    return result


@router.get("/bus/{bus_id}/eta", response_model=ETAResponse)
def get_bus_eta(bus_id: int, db: Session = Depends(get_db)):
    """Return ETA to all upcoming stops for a bus."""
    result = calculate_eta(db, bus_id)
    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Cannot calculate ETA — no active passengers or bus not found",
        )
    return result
