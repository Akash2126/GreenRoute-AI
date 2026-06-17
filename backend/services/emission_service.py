"""
services/emission_service.py - Carbon emission calculation service for GreenRoute AI
"""

from __future__ import annotations

from typing import Any
from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# kg CO2 emitted per km for each vehicle type (IPCC / EEA reference values)
EMISSION_FACTORS: dict[str, float] = {
    "car_petrol": 0.21,
    "car_diesel": 0.17,
    "car_electric": 0.05,
    "motorcycle": 0.11,
    "bus": 0.089,
    "truck": 0.25,
}

# Fuel consumption in litres per km (approximate)
FUEL_CONSUMPTION_FACTORS: dict[str, float] = {
    "car_petrol": 0.085,    # ~8.5 L/100 km
    "car_diesel": 0.070,    # ~7.0 L/100 km
    "car_electric": 0.0,    # electric – no liquid fuel
    "motorcycle": 0.045,    # ~4.5 L/100 km
    "bus": 0.30,            # ~30 L/100 km (shared)
    "truck": 0.35,          # ~35 L/100 km
}

# Approximate fuel cost per litre (INR) – can be overridden via env
FUEL_COST_PER_LITRE: dict[str, float] = {
    "car_petrol": 103.0,
    "car_diesel": 90.0,
    "car_electric": 0.0,   # cost not applicable; use electricity cost
    "motorcycle": 103.0,
    "bus": 90.0,
    "truck": 90.0,
}

# Average baseline vehicle: a petrol car with single occupant
BASELINE_VEHICLE = "car_petrol"

# One tree absorbs ~22 kg CO2 per year
CO2_PER_TREE_KG_PER_YEAR = 22.0


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class EmissionResult(BaseModel):
    """Result of an emission calculation for a single route segment."""
    vehicle_type: str
    distance_km: float
    occupants: int
    co2_kg: float               # total CO2 emitted
    co2_per_person_kg: float    # per-occupant CO2
    fuel_l: float               # fuel consumed (litres)
    cost_estimate_inr: float    # approximate fuel cost in INR
    trees_equivalent: int       # trees needed to offset annual


# ---------------------------------------------------------------------------
# Core service functions
# ---------------------------------------------------------------------------

def calculate_emissions(
    distance_km: float,
    vehicle_type: str = "car_petrol",
    occupants: int = 1,
) -> EmissionResult:
    """
    Calculate CO2 and fuel consumption for a single trip.

    Args:
        distance_km:  Route distance in kilometres.
        vehicle_type: One of the keys in EMISSION_FACTORS.
        occupants:    Number of passengers (used to compute per-person share).

    Returns:
        EmissionResult with full breakdown.
    """
    vehicle_type = vehicle_type.lower().replace("-", "_")
    if vehicle_type not in EMISSION_FACTORS:
        vehicle_type = "car_petrol"

    occupants = max(1, occupants)

    co2_kg = round(EMISSION_FACTORS[vehicle_type] * distance_km, 4)
    fuel_l = round(FUEL_CONSUMPTION_FACTORS[vehicle_type] * distance_km, 4)
    cost = round(fuel_l * FUEL_COST_PER_LITRE.get(vehicle_type, 90.0), 2)
    co2_per_person = round(co2_kg / occupants, 4)
    trees = get_tree_equivalents(co2_kg)

    return EmissionResult(
        vehicle_type=vehicle_type,
        distance_km=round(distance_km, 2),
        occupants=occupants,
        co2_kg=co2_kg,
        co2_per_person_kg=co2_per_person,
        fuel_l=fuel_l,
        cost_estimate_inr=cost,
        trees_equivalent=trees,
    )


def compare_route_emissions(routes: list[dict[str, Any]]) -> dict[str, Any]:
    """
    Compare emissions across multiple route variants and compute savings
    relative to the highest-emission route (the baseline).

    Args:
        routes: List of dicts, each must contain 'route_type', 'co2_kg',
                'fuel_l', 'distance_km', 'vehicle_type'.

    Returns:
        dict with 'routes' (annotated), 'baseline', 'max_savings', 'recommendations'.
    """
    if not routes:
        return {"routes": [], "baseline": None, "max_savings": None}

    # Identify baseline (worst emitter)
    baseline = max(routes, key=lambda r: r.get("co2_kg", 0))

    annotated: list[dict[str, Any]] = []
    for route in routes:
        co2 = route.get("co2_kg", 0.0)
        fuel = route.get("fuel_l", 0.0)
        co2_saved = round(baseline["co2_kg"] - co2, 4)
        fuel_saved = round(baseline["fuel_l"] - fuel, 4)
        pct_reduction = (
            round((co2_saved / baseline["co2_kg"]) * 100, 1)
            if baseline["co2_kg"] > 0
            else 0.0
        )
        annotated.append(
            {
                **route,
                "co2_saved_kg": max(0.0, co2_saved),
                "fuel_saved_l": max(0.0, fuel_saved),
                "co2_reduction_pct": max(0.0, pct_reduction),
            }
        )

    greenest = min(annotated, key=lambda r: r["co2_kg"])

    return {
        "routes": annotated,
        "baseline": baseline,
        "max_savings": {
            "co2_kg": greenest["co2_saved_kg"],
            "fuel_l": greenest["fuel_saved_l"],
            "pct": greenest["co2_reduction_pct"],
        },
        "recommendations": _build_recommendations(annotated),
    }


def get_tree_equivalents(co2_kg: float) -> int:
    """
    Convert CO2 kilograms into the number of trees required to absorb it
    over one year.

    Args:
        co2_kg: CO2 in kilograms.

    Returns:
        Number of trees (rounded up, minimum 0).
    """
    if co2_kg <= 0:
        return 0
    import math
    return math.ceil(co2_kg / CO2_PER_TREE_KG_PER_YEAR)


def calculate_baseline(distance_km: float) -> EmissionResult:
    """
    Calculate the average car (petrol) baseline emission for a given distance.

    Args:
        distance_km: Distance in kilometres.

    Returns:
        EmissionResult for the baseline vehicle.
    """
    return calculate_emissions(distance_km, BASELINE_VEHICLE, 1)


def get_monthly_emission_trend(trips: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Aggregate trip-level CO2 data into a daily trend suitable for charting.

    Args:
        trips: List of trip dicts with 'created_at' (ISO string or date)
               and 'co2_emissions_kg'.

    Returns:
        List of {'date': str, 'co2_kg': float} sorted ascending.
    """
    from collections import defaultdict
    from datetime import date

    daily: dict[str, float] = defaultdict(float)

    for trip in trips:
        raw_date = trip.get("created_at")
        if raw_date is None:
            continue
        if hasattr(raw_date, "date"):
            day_str = raw_date.date().isoformat()
        else:
            # Assume ISO string
            day_str = str(raw_date)[:10]
        daily[day_str] += trip.get("co2_emissions_kg", 0.0)

    return [
        {"date": day, "co2_kg": round(kg, 4)}
        for day, kg in sorted(daily.items())
    ]


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _build_recommendations(routes: list[dict[str, Any]]) -> list[str]:
    """Generate human-readable recommendation strings for route alternatives."""
    recommendations: list[str] = []
    for route in routes:
        rtype = route.get("route_type", "route").capitalize()
        pct = route.get("co2_reduction_pct", 0)
        if pct > 0:
            recommendations.append(
                f"{rtype} route saves {pct}% CO₂ compared to the highest-emission option."
            )
        elif pct == 0:
            recommendations.append(f"{rtype} route is the reference (highest emissions).")
    return recommendations
