from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from enum import Enum


class CrowdLevel(str, Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"


# ─── User ────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class UserResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


# ─── Route ───────────────────────────────────────────────────────────────────

class RouteResponse(BaseModel):
    id: int
    source: str
    destination: str

    class Config:
        from_attributes = True


# ─── Bus ─────────────────────────────────────────────────────────────────────

class BusResponse(BaseModel):
    id: int
    route_id: int
    bus_number: str

    class Config:
        from_attributes = True


# ─── BusStop ─────────────────────────────────────────────────────────────────

class BusStopResponse(BaseModel):
    id: int
    route_id: int
    stop_name: str
    latitude: float
    longitude: float
    stop_order: int

    class Config:
        from_attributes = True


# ─── LiveLocation ─────────────────────────────────────────────────────────────

class LocationCreate(BaseModel):
    user_id: int
    bus_id: int
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class LocationResponse(BaseModel):
    id: int
    user_id: int
    bus_id: int
    latitude: float
    longitude: float
    timestamp: datetime

    class Config:
        from_attributes = True


# ─── Bus Location (aggregated) ────────────────────────────────────────────────

class BusLocationResponse(BaseModel):
    bus_id: int
    bus_number: str
    latitude: float
    longitude: float
    active_passengers: int
    crowd_level: CrowdLevel
    last_updated: Optional[datetime]


# ─── ETA ─────────────────────────────────────────────────────────────────────

class StopETA(BaseModel):
    stop_id: int
    stop_name: str
    latitude: float
    longitude: float
    stop_order: int
    distance_km: float
    eta_minutes: Optional[float]


class ETAResponse(BaseModel):
    bus_id: int
    bus_number: str
    current_latitude: float
    current_longitude: float
    average_speed_kmh: float
    stops: List[StopETA]


# ─── WebSocket broadcast ──────────────────────────────────────────────────────

class BusBroadcast(BaseModel):
    bus_id: int
    bus_number: str
    route_id: int
    latitude: float
    longitude: float
    active_passengers: int
    crowd_level: CrowdLevel
    last_updated: Optional[str]
