"""
models/user.py - User ORM model for GreenRoute AI
"""

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from database import Base


class User(Base):
    """
    Represents an application user with sustainability tracking stats.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Sustainability stats (denormalized for fast retrieval)
    total_trips = Column(Integer, default=0, nullable=False)
    total_co2_saved = Column(Float, default=0.0, nullable=False)    # kg
    total_fuel_saved = Column(Float, default=0.0, nullable=False)   # litres
    avg_ecoscore = Column(Float, default=0.0, nullable=False)       # 0-100

    # Relationships
    trips = relationship("Trip", back_populates="user", cascade="all, delete-orphan")
    fleet_vehicles = relationship("FleetVehicle", back_populates="user", cascade="all, delete-orphan")
    user_achievements = relationship("UserAchievement", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User id={self.id} username={self.username!r} email={self.email!r}>"
