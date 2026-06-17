"""
services/sustainability_service.py - EcoScore engine and sustainability analytics for GreenRoute AI
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from services.emission_service import calculate_emissions, EMISSION_FACTORS


# ---------------------------------------------------------------------------
# EcoScore computation
# ---------------------------------------------------------------------------

def compute_ecoscore(
    distance_km: float,
    co2_kg: float,
    fuel_l: float,
    travel_time_min: float,
    traffic_level: str = "medium",
) -> float:
    """
    Compute an EcoScore (0-100) for a single route.

    Scoring components:
    - Emission intensity: 40 pts  (lower CO2/km = higher score)
    - Fuel efficiency:    30 pts  (lower fuel/km = higher score)
    - Drive optimality:   20 pts  (optimal speed ~60-80 km/h)
    - Traffic penalty:    10 pts  (penalty for high-traffic routes)

    Args:
        distance_km:      Trip distance.
        co2_kg:           Total CO2 emitted (kg).
        fuel_l:           Total fuel consumed (litres).
        travel_time_min:  Travel time in minutes.
        traffic_level:    'low' | 'medium' | 'high'.

    Returns:
        EcoScore float in [0, 100].
    """
    if distance_km <= 0:
        return 50.0

    co2_per_km = co2_kg / distance_km
    fuel_per_km = fuel_l / distance_km
    speed_kmh = (distance_km / travel_time_min * 60) if travel_time_min > 0 else 60

    # --- Emission component (40 pts) ---
    # Reference: 0.21 kg/km (average petrol car) → 0 pts
    #            0.05 kg/km (electric car)       → 40 pts
    emission_score = max(0.0, 40.0 * (1 - (co2_per_km - 0.05) / (0.21 - 0.05)))
    emission_score = min(40.0, emission_score)

    # --- Fuel component (30 pts) ---
    # 0 L/km (electric) → 30 pts
    # 0.085 L/km (petrol) → 0 pts
    fuel_score = max(0.0, 30.0 * (1 - fuel_per_km / 0.085))
    fuel_score = min(30.0, fuel_score)

    # --- Drive optimality (20 pts) ---
    # Optimal speed 60-80 km/h → full 20 pts; degrade outside
    optimal_low, optimal_high = 60.0, 80.0
    if optimal_low <= speed_kmh <= optimal_high:
        speed_score = 20.0
    else:
        deviation = min(abs(speed_kmh - optimal_low), abs(speed_kmh - optimal_high))
        speed_score = max(0.0, 20.0 - deviation * 0.4)

    # --- Traffic penalty (10 pts) ---
    traffic_scores = {"low": 10.0, "medium": 6.0, "high": 2.0}
    traffic_score = traffic_scores.get(traffic_level.lower(), 6.0)

    total = emission_score + fuel_score + speed_score + traffic_score
    return round(min(100.0, max(0.0, total)), 2)


def get_ecoscore_label(score: float) -> str:
    """
    Convert a numeric EcoScore into a human-readable label.

    Args:
        score: EcoScore in [0, 100].

    Returns:
        One of 'Excellent', 'Good', 'Moderate', 'Poor'.
    """
    if score >= 75:
        return "Excellent"
    elif score >= 55:
        return "Good"
    elif score >= 35:
        return "Moderate"
    else:
        return "Poor"


# ---------------------------------------------------------------------------
# Trend analysis
# ---------------------------------------------------------------------------

def compute_sustainability_trend(
    trips: list[dict[str, Any]],
    days: int = 30,
) -> list[dict[str, Any]]:
    """
    Compute a daily sustainability trend from trip history.

    Args:
        trips: List of trip dicts with 'created_at', 'ecoscore',
               'co2_emissions_kg', 'fuel_consumption_l'.
        days:  Number of days to look back.

    Returns:
        List of daily aggregates: {date, avg_ecoscore, total_co2_kg,
        total_fuel_l, trip_count}.
    """
    from collections import defaultdict

    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    daily: dict[str, dict[str, Any]] = defaultdict(
        lambda: {"ecoscore_sum": 0.0, "co2_kg": 0.0, "fuel_l": 0.0, "count": 0}
    )

    for trip in trips:
        created_at = trip.get("created_at")
        if created_at is None:
            continue
        if hasattr(created_at, "replace"):
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)
            if created_at < cutoff:
                continue
            day_str = created_at.date().isoformat()
        else:
            day_str = str(created_at)[:10]

        d = daily[day_str]
        d["ecoscore_sum"] += trip.get("ecoscore", 0.0)
        d["co2_kg"] += trip.get("co2_emissions_kg", 0.0)
        d["fuel_l"] += trip.get("fuel_consumption_l", 0.0)
        d["count"] += 1

    result = []
    for day_str in sorted(daily.keys()):
        d = daily[day_str]
        count = d["count"]
        result.append(
            {
                "date": day_str,
                "avg_ecoscore": round(d["ecoscore_sum"] / count, 2) if count else 0.0,
                "total_co2_kg": round(d["co2_kg"], 4),
                "total_fuel_l": round(d["fuel_l"], 4),
                "trip_count": count,
            }
        )
    return result


# ---------------------------------------------------------------------------
# Digital twin scenarios
# ---------------------------------------------------------------------------

def compute_digital_twin_scenarios(
    trips: list[dict[str, Any]],
) -> dict[str, Any]:
    """
    Project two hypothetical future scenarios from historical trip data.

    Scenario A – Status Quo: user continues at current emission rate.
    Scenario B – Green Switch: user adopts electric vehicle.

    Args:
        trips: Historical trip list.

    Returns:
        dict with 'scenario_a', 'scenario_b', and projections at 7/30/90 days.
    """
    if not trips:
        avg_co2_per_trip = 2.0
        avg_fuel_per_trip = 0.8
        avg_ecoscore = 50.0
        trips_per_day = 1.0
    else:
        avg_co2_per_trip = sum(t.get("co2_emissions_kg", 0) for t in trips) / len(trips)
        avg_fuel_per_trip = sum(t.get("fuel_consumption_l", 0) for t in trips) / len(trips)
        avg_ecoscore = sum(t.get("ecoscore", 0) for t in trips) / len(trips)
        # Estimate trips/day from date range
        dates = [t.get("created_at") for t in trips if t.get("created_at")]
        if len(dates) > 1:
            if hasattr(dates[0], "date"):
                days_range = max(1, (max(dates) - min(dates)).days)
            else:
                days_range = 30
            trips_per_day = len(trips) / days_range
        else:
            trips_per_day = 1.0

    # Electric factor reduces CO2 by ~76% and eliminates liquid fuel
    electric_co2_factor = EMISSION_FACTORS["car_electric"] / EMISSION_FACTORS.get("car_petrol", 0.21)

    def _project(factor_co2: float, factor_fuel: float, horizon_days: int) -> dict[str, Any]:
        total_trips = trips_per_day * horizon_days
        return {
            "horizon_days": horizon_days,
            "total_trips": round(total_trips),
            "total_co2_kg": round(avg_co2_per_trip * factor_co2 * total_trips, 2),
            "total_fuel_l": round(avg_fuel_per_trip * factor_fuel * total_trips, 2),
        }

    def _projections(factor_co2: float, factor_fuel: float) -> list[dict[str, Any]]:
        return [_project(factor_co2, factor_fuel, h) for h in (7, 30, 90)]

    scenario_a = {
        "name": "Status Quo",
        "description": "Continue current driving habits unchanged.",
        "vehicle_assumption": "Current vehicle",
        "projections": _projections(1.0, 1.0),
    }
    scenario_b = {
        "name": "Green Switch",
        "description": "Switch to an electric vehicle for all trips.",
        "vehicle_assumption": "Electric vehicle",
        "projections": _projections(electric_co2_factor, 0.0),
    }

    # Savings between A and B at 30 days
    a_30 = scenario_a["projections"][1]
    b_30 = scenario_b["projections"][1]
    co2_savings_30d = round(a_30["total_co2_kg"] - b_30["total_co2_kg"], 2)

    return {
        "scenario_a": scenario_a,
        "scenario_b": scenario_b,
        "co2_savings_30d_kg": co2_savings_30d,
        "avg_ecoscore": round(avg_ecoscore, 2),
    }


# ---------------------------------------------------------------------------
# Fleet sustainability
# ---------------------------------------------------------------------------

def compute_fleet_sustainability(vehicles: list[dict[str, Any]]) -> dict[str, Any]:
    """
    Compute aggregate sustainability score for a user's fleet.

    Args:
        vehicles: List of fleet vehicle dicts with 'vehicle_type', 'total_co2_kg',
                  'total_distance_km', 'ecoscore'.

    Returns:
        dict with 'fleet_ecoscore', 'total_co2_kg', 'total_distance_km',
        'best_vehicle', 'worst_vehicle', 'breakdown'.
    """
    if not vehicles:
        return {
            "fleet_ecoscore": 0.0,
            "total_co2_kg": 0.0,
            "total_distance_km": 0.0,
            "best_vehicle": None,
            "worst_vehicle": None,
            "breakdown": [],
        }

    total_co2 = sum(v.get("total_co2_kg", 0.0) for v in vehicles)
    total_dist = sum(v.get("total_distance_km", 0.0) for v in vehicles)
    avg_score = sum(v.get("ecoscore", 50.0) for v in vehicles) / len(vehicles)

    sorted_by_score = sorted(vehicles, key=lambda v: v.get("ecoscore", 0), reverse=True)

    return {
        "fleet_ecoscore": round(avg_score, 2),
        "total_co2_kg": round(total_co2, 4),
        "total_distance_km": round(total_dist, 2),
        "vehicle_count": len(vehicles),
        "best_vehicle": sorted_by_score[0] if sorted_by_score else None,
        "worst_vehicle": sorted_by_score[-1] if sorted_by_score else None,
        "breakdown": [
            {
                "name": v.get("name", "Unknown"),
                "vehicle_type": v.get("vehicle_type", "unknown"),
                "ecoscore": v.get("ecoscore", 0.0),
                "total_co2_kg": v.get("total_co2_kg", 0.0),
                "total_distance_km": v.get("total_distance_km", 0.0),
            }
            for v in vehicles
        ],
    }


# ---------------------------------------------------------------------------
# UN SDG metrics
# ---------------------------------------------------------------------------

def get_sdg_metrics(user_stats: dict[str, Any]) -> dict[str, Any]:
    """
    Compute UN Sustainable Development Goal impact metrics from user stats.

    Relevant SDGs:
    - SDG 11: Sustainable Cities and Communities
    - SDG 13: Climate Action
    - SDG 3:  Good Health and Well-being (air quality)

    Args:
        user_stats: dict with 'total_co2_saved', 'total_trips', 'total_fuel_saved'.

    Returns:
        dict with per-SDG impact data.
    """
    co2_saved = user_stats.get("total_co2_saved", 0.0)
    total_trips = user_stats.get("total_trips", 0)
    fuel_saved = user_stats.get("total_fuel_saved", 0.0)

    # Trees equivalent (1 tree ≈ 22 kg/yr)
    trees = int(co2_saved / 22)
    # km of travel that avoided high-emission vehicles
    km_green = user_stats.get("total_distance_km", total_trips * 10.0)
    # NOx equivalent: petrol car emits ~0.04 g NOx/km
    nox_avoided_g = km_green * 0.04

    return {
        "sdg_13_climate_action": {
            "co2_saved_kg": round(co2_saved, 2),
            "trees_equivalent": trees,
            "description": "CO₂ emissions prevented through eco-routing choices.",
        },
        "sdg_11_sustainable_cities": {
            "green_trips": total_trips,
            "km_eco_routed": round(km_green, 2),
            "description": "Trips planned with sustainability-first routing.",
        },
        "sdg_3_health": {
            "nox_avoided_g": round(nox_avoided_g, 2),
            "fuel_saved_l": round(fuel_saved, 2),
            "description": "NOₓ and particulates avoided through fuel savings.",
        },
    }


# ---------------------------------------------------------------------------
# Achievement unlocking
# ---------------------------------------------------------------------------

def unlock_achievements(
    user: Any,
    new_trip: dict[str, Any],
) -> list[str]:
    """
    Evaluate whether a new trip triggers any achievement milestones.

    Args:
        user:     ORM User object (must have total_trips, total_co2_saved,
                  total_fuel_saved, avg_ecoscore).
        new_trip: Trip dict representing the newly completed trip.

    Returns:
        List of achievement names that were just unlocked.
    """
    unlocked: list[str] = []

    total_trips = getattr(user, "total_trips", 0)
    total_co2_saved = getattr(user, "total_co2_saved", 0.0)
    total_fuel_saved = getattr(user, "total_fuel_saved", 0.0)
    avg_ecoscore = getattr(user, "avg_ecoscore", 0.0)

    # Trip count milestones
    trip_milestones = {
        1: "First Journey",
        10: "Road Warrior",
        50: "Mile Master",
        100: "Century Traveller",
    }
    for threshold, name in trip_milestones.items():
        if total_trips == threshold:
            unlocked.append(name)

    # CO2 saved milestones
    if total_co2_saved >= 10 and total_co2_saved - new_trip.get("co2_saved_kg", 0) < 10:
        unlocked.append("Carbon Saver")
    if total_co2_saved >= 100 and total_co2_saved - new_trip.get("co2_saved_kg", 0) < 100:
        unlocked.append("Climate Champion")

    # Fuel saved milestones
    if total_fuel_saved >= 50 and total_fuel_saved - new_trip.get("fuel_saved_l", 0) < 50:
        unlocked.append("Fuel Frugalist")

    # EcoScore milestones
    if avg_ecoscore >= 80:
        unlocked.append("Eco Legend")

    return unlocked
