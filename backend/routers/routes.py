"""
routers/routes.py - Route planning and trip history router for GreenRoute AI
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models.trip import Trip
from models.user import User
from routers.auth import get_current_user
from services.emission_service import calculate_baseline, compare_route_emissions
from services.route_engine import generate_route_variants, geocode_location
from services.gemini_service import explain_route_recommendation
from services.sustainability_service import (
    compute_ecoscore,
    unlock_achievements,
)

router = APIRouter(prefix="/api/routes", tags=["Routes"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class Coords(BaseModel):
    lat: float
    lon: float


class RoutePlanRequest(BaseModel):
    source: str
    destination: str
    vehicle_type: str = "car_petrol"
    source_coords: Coords | None = None
    dest_coords: Coords | None = None


class SaveTripRequest(BaseModel):
    source: str
    destination: str
    distance_km: float
    travel_time_min: float
    fuel_consumption_l: float
    co2_emissions_kg: float
    ecoscore: float
    route_type: str
    vehicle_type: str
    co2_saved_kg: float = 0.0
    fuel_saved_l: float = 0.0


class TripResponse(BaseModel):
    id: int
    source: str
    destination: str
    distance_km: float
    travel_time_min: float
    fuel_consumption_l: float
    co2_emissions_kg: float
    ecoscore: float
    route_type: str
    vehicle_type: str
    created_at: datetime
    co2_saved_kg: float
    fuel_saved_l: float

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/plan")
async def plan_route(
    payload: RoutePlanRequest,
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """
    Generate 3 route variants (fastest, shortest, greenest) between source and destination.

    Geocodes via Nominatim if coordinates are not supplied.
    Returns full route metrics for each variant.
    """
    # Resolve source coordinates
    if payload.source_coords:
        src = {"lat": payload.source_coords.lat, "lon": payload.source_coords.lon}
    else:
        src = await geocode_location(payload.source)
        if not src:
            raise HTTPException(
                status_code=422,
                detail=f"Could not geocode source location: '{payload.source}'",
            )

    # Resolve destination coordinates
    if payload.dest_coords:
        dst = {"lat": payload.dest_coords.lat, "lon": payload.dest_coords.lon}
    else:
        dst = await geocode_location(payload.destination, bias_coords=src)
        if not dst:
            raise HTTPException(
                status_code=422,
                detail=f"Could not geocode destination: '{payload.destination}'",
            )

    # Generate route variants
    routes = await generate_route_variants(src, dst, payload.vehicle_type)

    # Annotate each route with savings vs baseline
    comparison = compare_route_emissions(routes)

    # Call Gemini route advisor
    selected_type = "greenest" if len(routes) >= 3 else routes[0]["route_type"]
    ai_advice = await explain_route_recommendation(comparison["routes"], selected_type)

    return {
        "source": payload.source,
        "destination": payload.destination,
        "source_coords": src,
        "dest_coords": dst,
        "vehicle_type": payload.vehicle_type,
        "routes": comparison["routes"],
        "max_savings": comparison.get("max_savings"),
        "recommendations": comparison.get("recommendations", []),
        "ai_advice": ai_advice,
    }


@router.post("/save", response_model=TripResponse, status_code=201)
def save_trip(
    payload: SaveTripRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Trip:
    """
    Persist a completed trip, update user aggregate stats, and check for new achievements.

    Returns the saved trip record.
    """
    trip = Trip(
        user_id=current_user.id,
        source=payload.source,
        destination=payload.destination,
        distance_km=payload.distance_km,
        travel_time_min=payload.travel_time_min,
        fuel_consumption_l=payload.fuel_consumption_l,
        co2_emissions_kg=payload.co2_emissions_kg,
        ecoscore=payload.ecoscore,
        route_type=payload.route_type,
        vehicle_type=payload.vehicle_type,
        co2_saved_kg=payload.co2_saved_kg,
        fuel_saved_l=payload.fuel_saved_l,
    )
    db.add(trip)

    # Update user aggregate stats
    current_user.total_trips += 1
    current_user.total_co2_saved += payload.co2_saved_kg
    current_user.total_fuel_saved += payload.fuel_saved_l

    # Recalculate rolling average ecoscore
    all_trips_ecoscore = (
        current_user.avg_ecoscore * (current_user.total_trips - 1) + payload.ecoscore
    ) / current_user.total_trips
    current_user.avg_ecoscore = round(all_trips_ecoscore, 2)

    db.commit()
    db.refresh(trip)

    # Check achievements (non-blocking)
    try:
        unlock_achievements(current_user, payload.model_dump())
    except Exception:
        pass

    return trip


@router.get("/history", response_model=list[TripResponse])
def get_trip_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Trip]:
    """
    Return paginated trip history for the authenticated user (newest first).
    """
    offset = (page - 1) * page_size
    trips = (
        db.query(Trip)
        .filter(Trip.user_id == current_user.id)
        .order_by(Trip.created_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )
    return trips


@router.get("/{trip_id}", response_model=TripResponse)
def get_trip(
    trip_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Trip:
    """Return a single trip by ID (must belong to the authenticated user)."""
    trip = (
        db.query(Trip)
        .filter(Trip.id == trip_id, Trip.user_id == current_user.id)
        .first()
    )
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found.")
    return trip
