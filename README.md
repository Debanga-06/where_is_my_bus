# 🚌 Where Is My Bus

> **Crowdsourced real-time bus tracking — no hardware required.**  
> Passengers aboard a bus share their GPS coordinates; the system averages them to estimate the bus position and broadcasts it live to everyone watching.

---

## Table of Contents

1. [How It Works](#how-it-works)
2. [Architecture](#architecture)
3. [Project Structure](#project-structure)
4. [Tech Stack](#tech-stack)
5. [Quick Start — Docker (Recommended)](#quick-start--docker-recommended)
6. [Local Development (without Docker)](#local-development-without-docker)
7. [Google Maps Setup](#google-maps-setup)
8. [API Reference](#api-reference)
9. [WebSocket Protocol](#websocket-protocol)
10. [Services Deep Dive](#services-deep-dive)
11. [Database Schema](#database-schema)
12. [Deployment](#deployment)
13. [Environment Variables](#environment-variables)
14. [Troubleshooting](#troubleshooting)

---

## How It Works

```
Passenger A  ──┐
Passenger B  ──┼──► Backend averages GPS ──► Estimated Bus Position ──► WebSocket ──► All watchers
Passenger C  ──┘
```

1. **Passengers** open the app, select their route and bus, grant location permission.
2. The browser sends `POST /location` every **5 seconds** with `{ latitude, longitude }`.
3. The backend stores these in `live_locations`, discarding entries older than **30 seconds**.
4. A background task runs every **5 seconds**, averaging all active passenger coordinates per bus.
5. Results are broadcast over **WebSocket** (`/ws/route/{id}`) to all connected viewers.
6. ETA is computed as `remaining_distance / estimated_speed` using the Haversine formula.
7. **Crowd level** is derived from active passenger count: LOW (1–3), MODERATE (4–8), HIGH (9+).

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Browser                                 │
│  React + Vite + Tailwind CSS + Google Maps JS SDK               │
│                                                                  │
│  ┌──────────────┐  REST (axios)  ┌─────────────────────────┐   │
│  │ Pages/       │ ─────────────► │  FastAPI Backend          │   │
│  │ Components   │                │                           │   │
│  └──────────────┘  WebSocket     │  /routes  /location       │   │
│  ┌──────────────┐ ─────────────► │  /bus/{id}/location       │   │
│  │ useWebSocket │ ◄────────────  │  /bus/{id}/eta            │   │
│  │ hook         │   5s broadcast │  /ws/route/{id}           │   │
│  └──────────────┘                │                           │   │
│                                  │  Services:                │   │
│  ┌──────────────┐                │  • bus_location_service   │   │
│  │useLocationSh-│  POST /location│  • eta_service            │   │
│  │aring hook    │ ─────────────► │  • crowd_service          │   │
│  │(every 5s)    │                │                           │   │
│  └──────────────┘                └───────────┬───────────────┘   │
└─────────────────────────────────────────────┼───────────────────┘
                                              │ SQLAlchemy ORM
                                    ┌─────────▼──────────┐
                                    │    PostgreSQL 16    │
                                    │  users, routes,     │
                                    │  buses, bus_stops,  │
                                    │  live_locations     │
                                    └────────────────────┘
```

---

## Project Structure

```
where-is-my-bus/
├── docker-compose.yml          # Production compose
├── docker-compose.dev.yml      # Development compose (hot reload)
├── .env.example
│
├── backend/
│   ├── main.py                 # FastAPI app, lifespan, WebSocket endpoint
│   ├── database.py             # SQLAlchemy engine + session
│   ├── seed.py                 # Sample routes/buses/stops
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── alembic.ini
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/
│   │       └── 0001_initial.py
│   ├── models/
│   │   └── __init__.py         # User, Route, Bus, BusStop, LiveLocation
│   ├── schemas/
│   │   └── __init__.py         # Pydantic request/response models
│   ├── routers/
│   │   ├── routes.py           # GET /routes, /routes/{id}/buses, /stops
│   │   ├── location.py         # POST /location, GET /bus/{id}/location|eta
│   │   └── users.py            # POST /users
│   ├── services/
│   │   ├── bus_location_service.py   # Average GPS coordinates
│   │   ├── eta_service.py            # Haversine ETA calculation
│   │   └── crowd_service.py          # Crowd level classification
│   └── websocket/
│       └── manager.py          # ConnectionManager + broadcast_loop
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── Dockerfile
    ├── nginx.conf
    ├── .env.local.example
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── index.css
        ├── types/
        │   └── index.ts            # TypeScript interfaces
        ├── services/
        │   └── api.ts              # Axios API calls
        ├── context/
        │   └── store.ts            # Zustand global state
        ├── hooks/
        │   ├── useGeolocation.ts   # Browser Geolocation API wrapper
        │   ├── useLocationSharing.ts # 5-second GPS POST loop
        │   ├── useWebSocket.ts     # WS connection with auto-reconnect
        │   └── useGoogleMap.ts     # Google Maps SDK loader
        ├── components/
        │   ├── ui/
        │   │   ├── Navbar.tsx
        │   │   ├── CrowdBadge.tsx
        │   │   ├── ETACard.tsx
        │   │   └── Spinner.tsx
        │   └── map/
        │       └── BusMap.tsx      # Full Google Maps integration
        └── pages/
            ├── HomePage.tsx        # Name entry + feature overview
            ├── RoutesPage.tsx      # Route selection (Step 1)
            ├── BusesPage.tsx       # Bus selection (Step 2)
            ├── TrackingPage.tsx    # Live map + ETA + GPS sharing (Step 3)
            └── DashboardPage.tsx   # Fleet overview
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v3 |
| State management | Zustand (with localStorage persistence) |
| Maps | Google Maps JavaScript API v3 |
| HTTP client | Axios |
| Backend framework | FastAPI 0.111 |
| ORM | SQLAlchemy 2.0 |
| Database | PostgreSQL 16 |
| Migrations | Alembic |
| Real-time | WebSockets (native FastAPI) |
| Container | Docker + Docker Compose |
| Reverse proxy | Nginx |

---

## Quick Start — Docker (Recommended)

### Prerequisites
- Docker ≥ 24 and Docker Compose ≥ 2
- A Google Maps API key (see [Google Maps Setup](#google-maps-setup))

### Steps

```bash
# 1. Clone
git clone https://github.com/yourname/where-is-my-bus.git
cd where-is-my-bus

# 2. Copy and fill in env file
cp .env.example .env
#   → Edit VITE_GOOGLE_MAPS_API_KEY in .env

# 3. Build and start all services
docker compose up --build

# 4. Open the app
open http://localhost
# API docs available at http://localhost:8000/docs
```

The first run will:
- Start PostgreSQL and wait for it to be healthy
- Run `Base.metadata.create_all()` to create all tables
- Seed sample routes, buses, and stops automatically
- Start the FastAPI server with the WebSocket broadcaster
- Serve the React frontend via Nginx

---

## Local Development (without Docker)

### Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up PostgreSQL locally and create database
createdb whereismybus
createuser bususer -P           # password: buspassword

# Set env variable
export DATABASE_URL="postgresql://bususer:buspassword@localhost:5432/whereismybus"

# Start the server
uvicorn main:app --reload --port 8000
```

The server auto-creates tables and seeds data on startup.

### Frontend

```bash
cd frontend

# Copy and configure env
cp .env.local.example .env.local
# Edit VITE_GOOGLE_MAPS_API_KEY

npm install
npm run dev
# → http://localhost:5173
```

---

## Google Maps Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or select an existing one)
3. Navigate to **APIs & Services → Library**
4. Search for and enable **Maps JavaScript API**
5. Go to **APIs & Services → Credentials**
6. Click **Create Credentials → API Key**
7. (Recommended) Restrict the key to:
   - **HTTP referrers**: `localhost/*`, `yourdomain.com/*`
   - **APIs**: Maps JavaScript API only
8. Copy the key into your `.env` / `.env.local`:
   ```
   VITE_GOOGLE_MAPS_API_KEY=AIzaSy...
   ```

> **Note:** Without a valid API key the map will load in "development mode" with a watermark and limited usage. All other features (tracking, ETA, crowd level) work without the key.

---

## API Reference

### Routes

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/routes` | List all routes |
| `GET` | `/routes/{id}/buses` | List buses for a route |
| `GET` | `/routes/{id}/stops` | List stops for a route (ordered) |

### Location & Bus

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/location` | Submit a passenger GPS fix |
| `GET` | `/bus/{id}/location` | Get estimated bus position |
| `GET` | `/bus/{id}/eta` | Get ETA to all upcoming stops |

### Users

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/users/` | Create a user (returns `{ id, name }`) |

### Health

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Returns `{ "status": "ok" }` |

### Example: Submit location

```http
POST /location
Content-Type: application/json

{
  "user_id": 1,
  "bus_id": 2,
  "latitude": 22.6920,
  "longitude": 88.4570
}
```

### Example: Bus location response

```json
{
  "bus_id": 2,
  "bus_number": "WB-14A",
  "latitude": 22.6905,
  "longitude": 88.4558,
  "active_passengers": 4,
  "crowd_level": "MODERATE",
  "last_updated": "2024-06-01T14:23:11"
}
```

Full interactive docs: `http://localhost:8000/docs`

---

## WebSocket Protocol

**Connect:**
```
ws://localhost:8000/ws/route/{route_id}
```

**Server pushes every 5 seconds:**
```json
{
  "buses": [
    {
      "bus_id": 1,
      "bus_number": "WB-14A",
      "route_id": 1,
      "latitude": 22.6905,
      "longitude": 88.4558,
      "active_passengers": 4,
      "crowd_level": "MODERATE",
      "last_updated": "2024-06-01T14:23:11"
    }
  ]
}
```

- If there are no active passengers on any bus of the route, no message is sent that cycle.
- The client automatically reconnects after 3 seconds if the connection drops.

---

## Services Deep Dive

### `bus_location_service.py`

Averages GPS coordinates of all passengers whose `timestamp` is within the last **30 seconds**.

```
avg_lat = Σ(lat_i) / n
avg_lon = Σ(lon_i) / n
```

Only fresh readings are included; stale passengers (e.g. those who have disembarked) are automatically excluded.

### `eta_service.py`

Uses the **Haversine formula** to compute great-circle distance between two lat/lon points:

```
a = sin²(Δφ/2) + cos(φ₁)·cos(φ₂)·sin²(Δλ/2)
d = 2R · arcsin(√a)
```

Speed estimation: compares the oldest and newest aggregate positions within the last 60 seconds, clamped to 5–80 km/h. Falls back to **20 km/h** when less than 2 data points exist.

ETA = `cumulative_distance_km / speed_kmh × 60` (minutes)

### `crowd_service.py`

| Active passengers | Level |
|-------------------|-------|
| 1 – 3 | `LOW` |
| 4 – 8 | `MODERATE` |
| 9+ | `HIGH` |

---

## Database Schema

```sql
users        (id, name, created_at)
routes       (id, source, destination)
buses        (id, route_id→routes, bus_number UNIQUE)
bus_stops    (id, route_id→routes, stop_name, latitude, longitude, stop_order)
live_locations (id, user_id→users, bus_id→buses, latitude, longitude, timestamp)
```

Indexed columns: `live_locations.bus_id`, `live_locations.timestamp`, `bus_stops.route_id`, `buses.route_id`

---

## Deployment

### Production with Docker Compose

```bash
# On your server
git clone ...
cd where-is-my-bus

# Set real values
cp .env.example .env
nano .env

# Build images and run detached
docker compose up -d --build

# View logs
docker compose logs -f backend
```

### Scaling considerations

- Run multiple backend replicas behind a load balancer (use Redis pub/sub instead of in-process `ConnectionManager` for multi-instance WS).
- Add a `LiveLocation` cleanup job to purge rows older than 5 minutes (keeps the table small).
- Enable HTTPS in Nginx with Certbot for production.
- Restrict `allow_origins` in FastAPI's CORS middleware to your actual domain.

---

## Environment Variables

| Variable | Where | Description |
|----------|-------|-------------|
| `DATABASE_URL` | Backend | PostgreSQL connection string |
| `VITE_GOOGLE_MAPS_API_KEY` | Frontend | Google Maps JS API key |
| `VITE_API_URL` | Frontend | Backend REST base URL |
| `VITE_WS_URL` | Frontend | WebSocket base URL |

---

## Troubleshooting

**Map shows "For development purposes only"**  
→ Your Google Maps API key is missing or invalid. Check `VITE_GOOGLE_MAPS_API_KEY`.

**"No active passengers on this bus"**  
→ No one has shared their location in the last 30 seconds. Open the tracking page, grant GPS permission, and click "Share location".

**WebSocket won't connect**  
→ Make sure Nginx's `/ws/` proxy block is included and the backend is running. Check `docker compose logs backend`.

**Backend 500 errors**  
→ Usually a database connection issue. Run `docker compose logs db` and verify PostgreSQL is healthy.

**Location permission denied**  
→ The browser requires HTTPS for the Geolocation API on non-localhost origins. Use a valid SSL certificate in production.

**Seed data not appearing**  
→ The seed runs only if the `routes` table is empty. To re-seed: `docker compose exec db psql -U bususer -d whereismybus -c "TRUNCATE routes CASCADE;"` then restart the backend.

---

## License

MIT — build on it freely.
