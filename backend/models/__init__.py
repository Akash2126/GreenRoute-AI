"""
models/__init__.py - Registers all ORM models so SQLAlchemy can discover them.
"""

from models.user import User
from models.trip import Trip
from models.fleet import FleetVehicle
from models.achievement import Achievement, UserAchievement

__all__ = [
    "User",
    "Trip",
    "FleetVehicle",
    "Achievement",
    "UserAchievement",
]
