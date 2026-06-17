"""
services/xai_service.py - Explainable AI (XAI) service for GreenRoute AI

Provides feature importances, reasoning chains, and breakdowns
so the frontend can render "Why did the AI choose this?" panels.
"""

from __future__ import annotations

from typing import Any

from services.emission_service import EMISSION_FACTORS, calculate_emissions


# ---------------------------------------------------------------------------
# Traffic model feature importances
# ---------------------------------------------------------------------------

def get_traffic_feature_importance() -> dict[str, float]:
    """
    Return static (or loaded) feature importances for the Random Forest
    traffic prediction model.

    In production these are read from ml_models/rf_feature_importances.json.
    Falls back to hard-coded values when the file is missing.

    Returns:
        Dict mapping feature name → importance percentage (sums to 100).
    """
    import json
    import os

    json_path = os.path.join(
        os.path.dirname(__file__), "..", "ml_models", "rf_feature_importances.json"
    )
    try:
        with open(json_path, "r") as fh:
            data = json.load(fh)
        # Normalise to percentages if stored as fractions
        total = sum(data.values())
        if total <= 1.01:
            data = {k: round(v * 100, 1) for k, v in data.items()}
        return data
    except (FileNotFoundError, json.JSONDecodeError):
        return {
            "time_of_day": 42.0,
            "day_of_week": 20.0,
            "distance_km": 17.0,
            "weather_code": 11.0,
            "is_holiday": 10.0,
        }


# ---------------------------------------------------------------------------
# Emission breakdown
# ---------------------------------------------------------------------------

def get_emission_breakdown(
    distance: float,
    vehicle_type: str,
    occupants: int = 1,
) -> dict[str, Any]:
    """
    Decompose an emission result into human-interpretable factor contributions.

    Args:
        distance:     Trip distance in km.
        vehicle_type: Vehicle type string.
        occupants:    Number of occupants.

    Returns:
        dict with 'total_co2_kg', 'per_person_co2_kg', 'factors' (list of
        {factor, value, unit, pct, description}).
    """
    result = calculate_emissions(distance, vehicle_type, occupants)
    ef = EMISSION_FACTORS.get(vehicle_type, EMISSION_FACTORS["car_petrol"])

    # Approximate factor contributions (conceptual breakdown)
    engine_pct = 65.0
    idle_pct = 15.0
    ac_pct = 10.0
    tyre_pct = 5.0
    other_pct = 5.0

    factors = [
        {
            "factor": "Engine combustion",
            "value": round(result.co2_kg * engine_pct / 100, 4),
            "unit": "kg CO₂",
            "pct": engine_pct,
            "description": "Direct fuel combustion by the engine",
        },
        {
            "factor": "Idling / stop-start",
            "value": round(result.co2_kg * idle_pct / 100, 4),
            "unit": "kg CO₂",
            "pct": idle_pct,
            "description": "Emissions during traffic stops and idling",
        },
        {
            "factor": "Air conditioning",
            "value": round(result.co2_kg * ac_pct / 100, 4),
            "unit": "kg CO₂",
            "pct": ac_pct,
            "description": "Additional load from HVAC system",
        },
        {
            "factor": "Tyre & road friction",
            "value": round(result.co2_kg * tyre_pct / 100, 4),
            "unit": "kg CO₂",
            "pct": tyre_pct,
            "description": "Rolling resistance and tyre wear",
        },
        {
            "factor": "Other auxiliaries",
            "value": round(result.co2_kg * other_pct / 100, 4),
            "unit": "kg CO₂",
            "pct": other_pct,
            "description": "Lights, electronics, and auxiliary systems",
        },
    ]

    return {
        "total_co2_kg": result.co2_kg,
        "per_person_co2_kg": result.co2_per_person_kg,
        "emission_factor_kg_per_km": ef,
        "vehicle_type": vehicle_type,
        "distance_km": distance,
        "factors": factors,
    }


# ---------------------------------------------------------------------------
# Route recommendation reasoning
# ---------------------------------------------------------------------------

def get_route_recommendation_reasoning(
    route_data: list[dict[str, Any]],
    selected_route: str,
) -> list[str]:
    """
    Build a step-by-step reasoning chain explaining why the model selected
    a particular route variant.

    Args:
        route_data:     List of route variant dicts (from route engine).
        selected_route: Route type that was selected ('fastest' / 'shortest' / 'greenest').

    Returns:
        List of reasoning steps as human-readable strings.
    """
    if not route_data:
        return ["No route data available for analysis."]

    selected = next(
        (r for r in route_data if r.get("route_type") == selected_route), None
    )
    if selected is None:
        return [f"Route type '{selected_route}' not found in route data."]

    others = [r for r in route_data if r.get("route_type") != selected_route]

    chain: list[str] = []
    chain.append(
        f"Step 1 – Route enumeration: {len(route_data)} route variants were generated "
        f"(fastest, shortest, greenest)."
    )
    chain.append(
        f"Step 2 – Emission scoring: '{selected_route}' route has "
        f"{selected.get('co2_kg', 0):.3f} kg CO₂ over {selected.get('distance_km', 0):.1f} km."
    )

    for other in others:
        co2_diff = other.get("co2_kg", 0) - selected.get("co2_kg", 0)
        chain.append(
            f"Step 3 – Comparison with '{other.get('route_type')}': "
            f"{'saves' if co2_diff > 0 else 'uses'} "
            f"{abs(co2_diff):.3f} kg CO₂ {'more' if co2_diff < 0 else 'less'}."
        )

    chain.append(
        f"Step 4 – EcoScore: '{selected_route}' achieves an EcoScore of "
        f"{selected.get('ecoscore', 0):.1f}/100."
    )
    chain.append(
        f"Step 5 – Final recommendation: '{selected_route}' was selected as the optimal "
        f"balance of travel time ({selected.get('travel_time_min', 0):.0f} min) "
        f"and environmental impact."
    )

    return chain


# ---------------------------------------------------------------------------
# Forecast confidence
# ---------------------------------------------------------------------------

def get_forecast_confidence(horizon: str) -> float:
    """
    Return a confidence score (0–1) for a forecast horizon.
    Confidence decreases with longer horizons.

    Args:
        horizon: One of '1h', '24h', '7d', '30d', '90d'.

    Returns:
        Confidence score between 0 and 1.
    """
    confidence_map: dict[str, float] = {
        "1h": 0.95,
        "24h": 0.88,
        "7d": 0.75,
        "30d": 0.60,
        "90d": 0.45,
    }
    return confidence_map.get(horizon, 0.70)


# ---------------------------------------------------------------------------
# EcoScore breakdown
# ---------------------------------------------------------------------------

def get_ecoscore_breakdown(route_data: dict[str, Any]) -> dict[str, Any]:
    """
    Break down the EcoScore into its contributing factors so the UI can
    render a radar / bar chart.

    Args:
        route_data: A single route dict containing 'co2_kg', 'distance_km',
                    'travel_time_min', 'fuel_l', 'vehicle_type', 'ecoscore'.

    Returns:
        dict with 'total_ecoscore' and 'factors' list.
    """
    ecoscore = route_data.get("ecoscore", 50.0)
    vehicle_type = route_data.get("vehicle_type", "car_petrol")

    # Vehicle efficiency component (electric = best)
    vehicle_scores: dict[str, float] = {
        "car_electric": 30.0,
        "bus": 25.0,
        "car_diesel": 20.0,
        "motorcycle": 18.0,
        "car_petrol": 15.0,
        "truck": 5.0,
    }
    vehicle_score = vehicle_scores.get(vehicle_type, 15.0)

    emission_score = max(0.0, 30.0 - route_data.get("co2_kg", 0) * 2)
    emission_score = min(30.0, emission_score)

    distance = route_data.get("distance_km", 10.0)
    time_min = route_data.get("travel_time_min", 15.0)
    speed_kmh = (distance / time_min * 60) if time_min > 0 else 60
    # Optimal eco-speed ~60–80 km/h
    speed_score = max(0.0, 20.0 - abs(speed_kmh - 70) * 0.3)
    speed_score = min(20.0, speed_score)

    fuel_score = max(0.0, 20.0 - route_data.get("fuel_l", 0) * 3)
    fuel_score = min(20.0, fuel_score)

    factors = [
        {"factor": "Vehicle efficiency", "score": round(vehicle_score, 1), "max": 30.0, "pct": round(vehicle_score / 30 * 100, 1)},
        {"factor": "Emission level", "score": round(emission_score, 1), "max": 30.0, "pct": round(emission_score / 30 * 100, 1)},
        {"factor": "Drive speed optimality", "score": round(speed_score, 1), "max": 20.0, "pct": round(speed_score / 20 * 100, 1)},
        {"factor": "Fuel consumption", "score": round(fuel_score, 1), "max": 20.0, "pct": round(fuel_score / 20 * 100, 1)},
    ]

    return {
        "total_ecoscore": ecoscore,
        "factors": factors,
    }
