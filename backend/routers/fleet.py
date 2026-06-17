"""
routers/fleet.py - Fleet vehicle management router for GreenRoute AI
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models.fleet import FleetVehicle
from models.trip import Trip
from models.user import User
from routers.auth import get_current_user
from services.sustainability_service import compute_fleet_sustainability

router = APIRouter(prefix="/api/fleet", tags=["Fleet"])

VALID_VEHICLE_TYPES = {
    "car_petrol", "car_diesel", "car_electric", "motorcycle", "bus", "truck"
}
VALID_FUEL_TYPES = {"petrol", "diesel", "electric", "cng", "hybrid"}


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class FleetVehicleCreate(BaseModel):
    name: str
    vehicle_type: str
    license_plate: str | None = None
    fuel_type: str


class FleetVehicleUpdate(BaseModel):
    name: str | None = None
    vehicle_type: str | None = None
    license_plate: str | None = None
    fuel_type: str | None = None


class FleetVehicleResponse(BaseModel):
    id: int
    name: str
    vehicle_type: str
    license_plate: str | None
    fuel_type: str
    total_trips: int
    total_distance_km: float
    total_fuel_l: float
    total_co2_kg: float
    ecoscore: float
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/", response_model=list[FleetVehicleResponse])
def list_fleet(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[FleetVehicle]:
    """Return all fleet vehicles belonging to the authenticated user."""
    return (
        db.query(FleetVehicle)
        .filter(FleetVehicle.user_id == current_user.id)
        .order_by(FleetVehicle.created_at.desc())
        .all()
    )


@router.post("/vehicle", response_model=FleetVehicleResponse, status_code=201)
def add_vehicle(
    payload: FleetVehicleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FleetVehicle:
    """Add a new vehicle to the user's fleet."""
    vtype = payload.vehicle_type.lower().replace("-", "_")
    if vtype not in VALID_VEHICLE_TYPES:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid vehicle_type. Valid options: {sorted(VALID_VEHICLE_TYPES)}",
        )
    ftype = payload.fuel_type.lower()
    if ftype not in VALID_FUEL_TYPES:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid fuel_type. Valid options: {sorted(VALID_FUEL_TYPES)}",
        )

    vehicle = FleetVehicle(
        user_id=current_user.id,
        name=payload.name,
        vehicle_type=vtype,
        license_plate=payload.license_plate,
        fuel_type=ftype,
    )
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.put("/vehicle/{vehicle_id}", response_model=FleetVehicleResponse)
def update_vehicle(
    vehicle_id: int,
    payload: FleetVehicleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FleetVehicle:
    """Update a fleet vehicle's attributes."""
    vehicle = (
        db.query(FleetVehicle)
        .filter(FleetVehicle.id == vehicle_id, FleetVehicle.user_id == current_user.id)
        .first()
    )
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found.")

    if payload.name is not None:
        vehicle.name = payload.name
    if payload.vehicle_type is not None:
        vtype = payload.vehicle_type.lower().replace("-", "_")
        if vtype not in VALID_VEHICLE_TYPES:
            raise HTTPException(status_code=422, detail=f"Invalid vehicle_type: {vtype}")
        vehicle.vehicle_type = vtype
    if payload.license_plate is not None:
        vehicle.license_plate = payload.license_plate
    if payload.fuel_type is not None:
        ftype = payload.fuel_type.lower()
        if ftype not in VALID_FUEL_TYPES:
            raise HTTPException(status_code=422, detail=f"Invalid fuel_type: {ftype}")
        vehicle.fuel_type = ftype

    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.delete("/vehicle/{vehicle_id}", status_code=200)
def delete_vehicle(
    vehicle_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Remove a vehicle from the user's fleet."""
    vehicle = (
        db.query(FleetVehicle)
        .filter(FleetVehicle.id == vehicle_id, FleetVehicle.user_id == current_user.id)
        .first()
    )
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found.")

    db.delete(vehicle)
    db.commit()
    return {"message": "Vehicle deleted successfully."}


@router.get("/analytics")
def fleet_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Return fleet-level sustainability analytics."""
    vehicles = (
        db.query(FleetVehicle).filter(FleetVehicle.user_id == current_user.id).all()
    )
    vehicles_data = [
        {
            "name": v.name,
            "vehicle_type": v.vehicle_type,
            "total_co2_kg": v.total_co2_kg,
            "total_distance_km": v.total_distance_km,
            "total_fuel_l": v.total_fuel_l,
            "ecoscore": v.ecoscore,
            "total_trips": v.total_trips,
        }
        for v in vehicles
    ]
    return compute_fleet_sustainability(vehicles_data)


@router.get("/{vehicle_id}/trips")
def vehicle_trips(
    vehicle_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    Return trips associated with a specific fleet vehicle
    (matched by vehicle_type since trips don't store a direct fleet FK).
    """
    vehicle = (
        db.query(FleetVehicle)
        .filter(FleetVehicle.id == vehicle_id, FleetVehicle.user_id == current_user.id)
        .first()
    )
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found.")

    trips = (
        db.query(Trip)
        .filter(
            Trip.user_id == current_user.id,
            Trip.vehicle_type == vehicle.vehicle_type,
        )
        .order_by(Trip.created_at.desc())
        .limit(50)
        .all()
    )

    return {
        "vehicle": {
            "id": vehicle.id,
            "name": vehicle.name,
            "vehicle_type": vehicle.vehicle_type,
        },
        "trips": [
            {
                "id": t.id,
                "source": t.source,
                "destination": t.destination,
                "distance_km": t.distance_km,
                "co2_emissions_kg": t.co2_emissions_kg,
                "ecoscore": t.ecoscore,
                "created_at": t.created_at.isoformat(),
            }
            for t in trips
        ],
        "trip_count": len(trips),
    }
