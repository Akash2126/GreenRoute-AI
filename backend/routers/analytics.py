"""
routers/analytics.py - Analytics router for GreenRoute AI

Provides emission trends, EcoScore history, fleet analytics,
sustainability metrics, and carbon intelligence endpoints.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from models.trip import Trip
from models.user import User
from routers.auth import get_current_user
from services.emission_service import get_monthly_emission_trend, get_tree_equivalents
from services.sustainability_service import (
    compute_sustainability_trend,
    get_sdg_metrics,
)

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _trips_since(db: Session, user_id: int, days: int) -> list[Trip]:
    """Return trips for a user within the last `days` days."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    return (
        db.query(Trip)
        .filter(Trip.user_id == user_id, Trip.created_at >= cutoff)
        .order_by(Trip.created_at.asc())
        .all()
    )


def _trip_to_dict(t: Trip) -> dict[str, Any]:
    return {
        "created_at": t.created_at,
        "co2_emissions_kg": t.co2_emissions_kg,
        "co2_saved_kg": t.co2_saved_kg,
        "fuel_consumption_l": t.fuel_consumption_l,
        "fuel_saved_l": t.fuel_saved_l,
        "ecoscore": t.ecoscore,
        "distance_km": t.distance_km,
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/overview")
def analytics_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    Return high-level sustainability statistics for the authenticated user.
    Includes trees equivalent and monthly CO2 saved.
    """
    trees = get_tree_equivalents(current_user.total_co2_saved)

    # Monthly CO2 saved (last 30 days)
    monthly_trips = _trips_since(db, current_user.id, 30)
    monthly_co2_saved = round(sum(t.co2_saved_kg for t in monthly_trips), 4)
    monthly_fuel_saved = round(sum(t.fuel_saved_l for t in monthly_trips), 4)

    return {
        "total_trips": current_user.total_trips,
        "total_co2_saved": round(current_user.total_co2_saved, 4),
        "total_fuel_saved": round(current_user.total_fuel_saved, 4),
        "avg_ecoscore": round(current_user.avg_ecoscore, 2),
        "trees_equivalent": trees,
        "monthly_co2_saved": monthly_co2_saved,
        "monthly_fuel_saved": monthly_fuel_saved,
        "monthly_trip_count": len(monthly_trips),
    }


@router.get("/emissions")
def emission_trend(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    """
    Return daily CO2 emission totals for the last `days` days.
    """
    trips = _trips_since(db, current_user.id, days)
    return get_monthly_emission_trend([_trip_to_dict(t) for t in trips])


@router.get("/ecoscore")
def ecoscore_trend(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    """
    Return daily average EcoScore for the last `days` days.
    """
    trips = _trips_since(db, current_user.id, days)
    trend = compute_sustainability_trend([_trip_to_dict(t) for t in trips], days)
    return [{"date": d["date"], "avg_ecoscore": d["avg_ecoscore"]} for d in trend]


@router.get("/fuel")
def fuel_trend(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    """
    Return daily fuel consumption and savings for the last `days` days.
    """
    trips = _trips_since(db, current_user.id, days)
    daily: dict[str, dict[str, float]] = defaultdict(lambda: {"fuel_l": 0.0, "fuel_saved_l": 0.0})
    for t in trips:
        day = t.created_at.date().isoformat()
        daily[day]["fuel_l"] += t.fuel_consumption_l
        daily[day]["fuel_saved_l"] += t.fuel_saved_l

    return [
        {
            "date": day,
            "fuel_l": round(v["fuel_l"], 4),
            "fuel_saved_l": round(v["fuel_saved_l"], 4),
        }
        for day, v in sorted(daily.items())
    ]


@router.get("/sustainability")
def sustainability_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    Return comprehensive sustainability metrics including UN SDG impact data.
    """
    all_trips = db.query(Trip).filter(Trip.user_id == current_user.id).all()
    total_distance = sum(t.distance_km for t in all_trips)

    user_stats = {
        "total_trips": current_user.total_trips,
        "total_co2_saved": current_user.total_co2_saved,
        "total_fuel_saved": current_user.total_fuel_saved,
        "avg_ecoscore": current_user.avg_ecoscore,
        "total_distance_km": total_distance,
    }

    sdg = get_sdg_metrics(user_stats)
    trend = compute_sustainability_trend([_trip_to_dict(t) for t in all_trips], 30)

    return {
        "user_stats": user_stats,
        "sdg_metrics": sdg,
        "sustainability_trend": trend[-7:],  # last 7 data points
        "sustainability_score": round(current_user.avg_ecoscore, 2),
    }


@router.get("/carbon-intelligence")
def carbon_intelligence(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    Return aggregated carbon intelligence report:
    daily, weekly, and monthly emission and saving totals.
    """
    daily_trips = _trips_since(db, current_user.id, 1)
    weekly_trips = _trips_since(db, current_user.id, 7)
    monthly_trips = _trips_since(db, current_user.id, 30)

    def _agg(trips: list[Trip]) -> dict[str, float]:
        return {
            "co2_kg": round(sum(t.co2_emissions_kg for t in trips), 4),
            "co2_saved_kg": round(sum(t.co2_saved_kg for t in trips), 4),
            "fuel_l": round(sum(t.fuel_consumption_l for t in trips), 4),
            "fuel_saved_l": round(sum(t.fuel_saved_l for t in trips), 4),
            "trip_count": len(trips),
        }

    return {
        "daily": _agg(daily_trips),
        "weekly": _agg(weekly_trips),
        "monthly": _agg(monthly_trips),
        "cumulative": {
            "co2_saved_kg": round(current_user.total_co2_saved, 4),
            "fuel_saved_l": round(current_user.total_fuel_saved, 4),
            "trees_equivalent": get_tree_equivalents(current_user.total_co2_saved),
        },
    }
