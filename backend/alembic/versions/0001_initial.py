"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table(
        "routes",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("source", sa.String(200), nullable=False),
        sa.Column("destination", sa.String(200), nullable=False),
    )

    op.create_table(
        "buses",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("route_id", sa.Integer, sa.ForeignKey("routes.id"), nullable=False),
        sa.Column("bus_number", sa.String(20), nullable=False, unique=True),
    )

    op.create_table(
        "bus_stops",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("route_id", sa.Integer, sa.ForeignKey("routes.id"), nullable=False),
        sa.Column("stop_name", sa.String(200), nullable=False),
        sa.Column("latitude", sa.Float, nullable=False),
        sa.Column("longitude", sa.Float, nullable=False),
        sa.Column("stop_order", sa.Integer, nullable=False, default=0),
    )

    op.create_table(
        "live_locations",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("bus_id", sa.Integer, sa.ForeignKey("buses.id"), nullable=False),
        sa.Column("latitude", sa.Float, nullable=False),
        sa.Column("longitude", sa.Float, nullable=False),
        sa.Column("timestamp", sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # Indexes for performance
    op.create_index("ix_live_locations_bus_id", "live_locations", ["bus_id"])
    op.create_index("ix_live_locations_user_id", "live_locations", ["user_id"])
    op.create_index("ix_live_locations_timestamp", "live_locations", ["timestamp"])
    op.create_index("ix_bus_stops_route_id", "bus_stops", ["route_id"])
    op.create_index("ix_buses_route_id", "buses", ["route_id"])


def downgrade() -> None:
    op.drop_table("live_locations")
    op.drop_table("bus_stops")
    op.drop_table("buses")
    op.drop_table("routes")
    op.drop_table("users")
