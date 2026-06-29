from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    live_locations = relationship("LiveLocation", back_populates="user")


class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String(200), nullable=False)
    destination = Column(String(200), nullable=False)

    buses = relationship("Bus", back_populates="route")
    stops = relationship("BusStop", back_populates="route", order_by="BusStop.stop_order")


class Bus(Base):
    __tablename__ = "buses"

    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(Integer, ForeignKey("routes.id"), nullable=False)
    bus_number = Column(String(20), nullable=False, unique=True)

    route = relationship("Route", back_populates="buses")
    live_locations = relationship("LiveLocation", back_populates="bus")


class BusStop(Base):
    __tablename__ = "bus_stops"

    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(Integer, ForeignKey("routes.id"), nullable=False)
    stop_name = Column(String(200), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    stop_order = Column(Integer, nullable=False, default=0)

    route = relationship("Route", back_populates="stops")


class LiveLocation(Base):
    __tablename__ = "live_locations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    bus_id = Column(Integer, ForeignKey("buses.id"), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    timestamp = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="live_locations")
    bus = relationship("Bus", back_populates="live_locations")
