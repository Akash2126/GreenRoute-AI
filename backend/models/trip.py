"""
models/trip.py - Trip ORM model for GreenRoute AI
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from database import Base


class Trip(Base):
    """
    Represents a completed or planned trip with full emission and eco-score data.
    """
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Route info
    source = Column(String(500), nullable=False)
    destination = Column(String(500), nullable=False)
    distance_km = Column(Float, nullable=False)
    travel_time_min = Column(Float, nullable=False)

    # Emission metrics
    fuel_consumption_l = Column(Float, nullable=False)
    co2_emissions_kg = Column(Float, nullable=False)
    ecoscore = Column(Float, nullable=False)           # 0-100
    co2_saved_kg = Column(Float, default=0.0, nullable=False)
    fuel_saved_l = Column(Float, default=0.0, nullable=False)

    # Trip metadata
    route_type = Column(String(50), nullable=False)    # fastest | shortest | greenest
    vehicle_type = Column(String(50), nullable=False)  # car_petrol | car_electric | ...
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="trips")

    def __repr__(self) -> str:
        return (
            f"<Trip id={self.id} user_id={self.user_id} "
            f"route={self.source!r}->{self.destination!r} ecoscore={self.ecoscore}>"
        )
