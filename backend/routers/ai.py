"""
routers/ai.py - AI/ML inference router for GreenRoute AI

Exposes traffic prediction, forecasting, XAI breakdowns, and Gemini AI advisor endpoints.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models.trip import Trip
from models.user import User
from routers.auth import get_current_user
from services import (
    forecasting_service,
    gemini_service,
    traffic_prediction,
    xai_service,
)

router = APIRouter(prefix="/api/ai", tags=["AI / ML"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class AdvisorRequest(BaseModel):
    routes: list[dict[str, Any]]
    selected_route: str
    user_context: dict[str, Any] | None = None


class DigitalTwinRequest(BaseModel):
    saved_co2: float
    saved_fuel: float
    horizon_days: int
    avg_ecoscore: float


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/advisor")
async def ai_advisor(
    payload: AdvisorRequest,
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """
    Ask Gemini to explain why the selected route is the recommended choice.

    Returns a plain-text explanation and a reasoning chain from the XAI service.
    """
    explanation = await gemini_service.explain_route_recommendation(
        payload.routes, payload.selected_route
    )
    reasoning = xai_service.get_route_recommendation_reasoning(
        payload.routes, payload.selected_route
    )
    return {
        "explanation": explanation,
        "reasoning_chain": reasoning,
        "selected_route": payload.selected_route,
    }


@router.get("/traffic")
def traffic_prediction_endpoint(
    hour: int = Query(..., ge=0, le=23, description="Hour of day (0-23)"),
    day: int = Query(..., ge=0, le=6, description="Day of week (0=Mon, 6=Sun)"),
    distance: float = Query(10.0, ge=0.1, description="Route distance in km"),
    is_holiday: int = Query(0, ge=0, le=1, description="1 if public holiday"),
    weather_code: int = Query(0, ge=0, le=3, description="0=clear,1=cloudy,2=rain,3=fog"),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """
    Predict traffic level for given time and route conditions.

    Returns level (low/medium/high), confidence, and interpretable factors.
    """
    return traffic_prediction.predict_traffic(
        hour=hour,
        day_of_week=day,
        distance_km=distance,
        is_holiday=is_holiday,
        weather_code=weather_code,
    )


@router.get("/forecast")
def forecast(
    horizon: str = Query(
        "24h",
        description="Forecast horizon: 1h | 24h | 7d | 30d | 90d",
    ),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """
    Generate a traffic/emissions forecast for the requested time horizon.

    Returns a list of data points with timestamp, traffic_level, co2_kg,
    fuel_l, ecoscore, and confidence.
    """
    horizon_map = {
        "1h": forecasting_service.forecast_next_hour,
        "24h": forecasting_service.forecast_next_24h,
        "7d": forecasting_service.forecast_7_days,
        "30d": forecasting_service.forecast_30_days,
        "90d": forecasting_service.forecast_90_days,
    }

    fn = horizon_map.get(horizon)
    if fn is None:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid horizon '{horizon}'. Valid options: {list(horizon_map.keys())}",
        )

    data = fn()
    confidence = xai_service.get_forecast_confidence(horizon)

    return {
        "horizon": horizon,
        "confidence": confidence,
        "data_points": len(data) if isinstance(data, list) else 1,
        "data": data,
    }


@router.get("/xai/traffic")
def xai_traffic_importance(
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """
    Return feature importances for the traffic prediction model.
    Useful for rendering feature importance bar charts in the UI.
    """
    importances = xai_service.get_traffic_feature_importance()
    return {
        "model": "RandomForest Traffic Classifier",
        "feature_importances": importances,
        "description": "Percentage contribution of each feature to traffic level predictions.",
    }


@router.get("/xai/emission")
def xai_emission_breakdown(
    distance: float = Query(..., ge=0.1, description="Trip distance in km"),
    vehicle_type: str = Query("car_petrol", description="Vehicle type"),
    occupants: int = Query(1, ge=1, le=50, description="Number of occupants"),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """
    Break down CO2 emissions into contributing factors for the given trip parameters.
    """
    return xai_service.get_emission_breakdown(distance, vehicle_type, occupants)


@router.get("/xai/route")
def xai_route_reasoning(
    trip_id: int = Query(..., description="Trip ID to explain"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    Generate an XAI reasoning chain for a saved trip, explaining why
    the chosen route variant was the best recommendation.
    """
    trip = (
        db.query(Trip)
        .filter(Trip.id == trip_id, Trip.user_id == current_user.id)
        .first()
    )
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found.")

    # Reconstruct minimal route data from the saved trip
    route_data = [
        {
            "route_type": trip.route_type,
            "distance_km": trip.distance_km,
            "travel_time_min": trip.travel_time_min,
            "co2_kg": trip.co2_emissions_kg,
            "fuel_l": trip.fuel_consumption_l,
            "ecoscore": trip.ecoscore,
        }
    ]

    reasoning = xai_service.get_route_recommendation_reasoning(route_data, trip.route_type)
    ecoscore_breakdown = xai_service.get_ecoscore_breakdown(route_data[0])

    return {
        "trip_id": trip_id,
        "route_type": trip.route_type,
        "reasoning_chain": reasoning,
        "ecoscore_breakdown": ecoscore_breakdown,
    }


@router.get("/climate-tips")
async def climate_tips(
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """
    Generate personalised climate action tips via Gemini AI based on user stats.
    """
    user_stats = {
        "total_trips": current_user.total_trips,
        "total_co2_saved": current_user.total_co2_saved,
        "total_fuel_saved": current_user.total_fuel_saved,
        "avg_ecoscore": current_user.avg_ecoscore,
    }

    tips = await gemini_service.get_climate_tips(user_stats)
    insight = await gemini_service.generate_sustainability_insight(user_stats)

    return {
        "tips": tips,
        "sustainability_insight": insight,
        "user_stats": user_stats,
    }


@router.post("/digital-twin")
async def digital_twin_endpoint(
    payload: DigitalTwinRequest,
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """
    Analyze digital twin projections with Gemini AI and generate comparisons and behavioral recommendations.
    """
    return await gemini_service.get_digital_twin_advice(
        saved_co2=payload.saved_co2,
        saved_fuel=payload.saved_fuel,
        horizon_days=payload.horizon_days,
        avg_ecoscore=payload.avg_ecoscore,
    )
