"""
Seed the database with sample routes, buses, and stops.
Run once after `alembic upgrade head` or after the tables are created.
"""

from database import SessionLocal
from models import Route, Bus, BusStop


def seed():
    db = SessionLocal()
    try:
        if db.query(Route).count() > 0:
            print("Database already seeded — skipping.")
            return

        # ── Routes ────────────────────────────────────────────────────────────
        r1 = Route(source="Heta", destination="Birati More")
        r2 = Route(source="Birati More", destination="Heta")
        r3 = Route(source="Barasat", destination="Dumdum Metro")
        db.add_all([r1, r2, r3])
        db.flush()

        # ── Buses ─────────────────────────────────────────────────────────────
        buses_r1 = [Bus(route_id=r1.id, bus_number=f"WB-{n}") for n in ["14A", "14B", "14C"]]
        buses_r2 = [Bus(route_id=r2.id, bus_number=f"WB-{n}") for n in ["15A", "15B"]]
        buses_r3 = [Bus(route_id=r3.id, bus_number=f"WB-{n}") for n in ["220", "220A"]]
        db.add_all(buses_r1 + buses_r2 + buses_r3)

        # ── Stops — Route 1: Heta → Birati More ──────────────────────────────
        stops_r1 = [
            BusStop(route_id=r1.id, stop_name="Heta Bus Stand",      latitude=22.6800, longitude=88.4050, stop_order=1),
            BusStop(route_id=r1.id, stop_name="Madhyamgram Chowk",   latitude=22.6970, longitude=88.4390, stop_order=2),
            BusStop(route_id=r1.id, stop_name="Rajarhat More",       latitude=22.6750, longitude=88.4700, stop_order=3),
            BusStop(route_id=r1.id, stop_name="New Town Gate",       latitude=22.6600, longitude=88.4620, stop_order=4),
            BusStop(route_id=r1.id, stop_name="Birati More",         latitude=22.6920, longitude=88.4570, stop_order=5),
        ]

        # ── Stops — Route 2: Birati More → Heta (reverse) ───────────────────
        stops_r2 = [
            BusStop(route_id=r2.id, stop_name="Birati More",         latitude=22.6920, longitude=88.4570, stop_order=1),
            BusStop(route_id=r2.id, stop_name="New Town Gate",       latitude=22.6600, longitude=88.4620, stop_order=2),
            BusStop(route_id=r2.id, stop_name="Rajarhat More",       latitude=22.6750, longitude=88.4700, stop_order=3),
            BusStop(route_id=r2.id, stop_name="Madhyamgram Chowk",   latitude=22.6970, longitude=88.4390, stop_order=4),
            BusStop(route_id=r2.id, stop_name="Heta Bus Stand",      latitude=22.6800, longitude=88.4050, stop_order=5),
        ]

        # ── Stops — Route 3: Barasat → Dumdum Metro ──────────────────────────
        stops_r3 = [
            BusStop(route_id=r3.id, stop_name="Barasat Bus Stand",   latitude=22.7200, longitude=88.4800, stop_order=1),
            BusStop(route_id=r3.id, stop_name="Belghoria",           latitude=22.6950, longitude=88.3980, stop_order=2),
            BusStop(route_id=r3.id, stop_name="Dunlop",              latitude=22.6580, longitude=88.3740, stop_order=3),
            BusStop(route_id=r3.id, stop_name="Dumdum Cantonment",   latitude=22.6450, longitude=88.3880, stop_order=4),
            BusStop(route_id=r3.id, stop_name="Dumdum Metro",        latitude=22.6367, longitude=88.3940, stop_order=5),
        ]

        db.add_all(stops_r1 + stops_r2 + stops_r3)
        db.commit()
        print("✅  Database seeded successfully.")
    except Exception as e:
        db.rollback()
        print(f"❌  Seeding failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
