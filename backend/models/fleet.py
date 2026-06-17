"""
models/fleet.py - Fleet vehicle ORM model for GreenRoute AI
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from database import Base


class FleetVehicle(Base):
    """
    Represents a vehicle registered in a user's fleet.
    Tracks cumulative environmental performance metrics.
    """
    __tablename__ = "fleet_vehicles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Vehicle identity
    name = Column(String(200), nullable=False)
    vehicle_type = Column(String(50), nullable=False)   # car_petrol | car_diesel | car_electric | motorcycle | bus | truck
    license_plate = Column(String(50), nullable=True)
    fuel_type = Column(String(50), nullable=False)      # petrol | diesel | electric | cng | hybrid

    # Cumulative performance stats
    total_trips = Column(Integer, default=0, nullable=False)
    total_distance_km = Column(Float, default=0.0, nullable=False)
    total_fuel_l = Column(Float, default=0.0, nullable=False)
    total_co2_kg = Column(Float, default=0.0, nullable=False)
    ecoscore = Column(Float, default=0.0, nullable=False)    # 0-100

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="fleet_vehicles")

    def __repr__(self) -> str:
        return (
            f"<FleetVehicle id={self.id} name={self.name!r} "
            f"type={self.vehicle_type!r} plate={self.license_plate!r}>"
        )
