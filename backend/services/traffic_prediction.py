"""
services/traffic_prediction.py - Random Forest traffic prediction service for GreenRoute AI

Loads a pre-trained RandomForestClassifier from ml_models/rf_traffic_model.pkl.
Falls back to a rule-based engine when the model file is not found.
"""

from __future__ import annotations

import os
from typing import Any

import numpy as np

# ---------------------------------------------------------------------------
# Module-level model cache
# ---------------------------------------------------------------------------
_rf_model = None
_model_load_attempted = False

TRAFFIC_LABELS = {0: "low", 1: "medium", 2: "high"}
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "ml_models", "rf_traffic_model.pkl")


def load_model() -> Any | None:
    """
    Load the Random Forest model from disk (once, at startup).

    Returns:
        Fitted sklearn model or None if the file is absent.
    """
    global _rf_model, _model_load_attempted
    if _model_load_attempted:
        return _rf_model

    _model_load_attempted = True
    try:
        import joblib
        _rf_model = joblib.load(MODEL_PATH)
        print(f"[TrafficService] RF model loaded from {MODEL_PATH}")
    except (FileNotFoundError, Exception) as exc:
        print(f"[TrafficService] RF model not found, using rule-based fallback. ({exc})")
        _rf_model = None

    return _rf_model


def predict_traffic(
    hour: int,
    day_of_week: int,
    distance_km: float,
    is_holiday: int = 0,
    weather_code: int = 0,
) -> dict[str, Any]:
    """
    Predict traffic level for given conditions.

    Args:
        hour:         Hour of day (0-23).
        day_of_week:  0=Monday, 6=Sunday.
        distance_km:  Route distance in km.
        is_holiday:   1 if public holiday, else 0.
        weather_code: 0=clear, 1=cloudy, 2=rain, 3=fog.

    Returns:
        dict: {level: str, confidence: float, factors: dict, class_id: int}
    """
    model = load_model()

    if model is not None:
        return _predict_with_model(model, hour, day_of_week, distance_km, is_holiday, weather_code)
    else:
        return _rule_based_prediction(hour, day_of_week, is_holiday, weather_code)


def _predict_with_model(
    model: Any,
    hour: int,
    day_of_week: int,
    distance_km: float,
    is_holiday: int,
    weather_code: int,
) -> dict[str, Any]:
    """Run inference using the pre-trained Random Forest model."""
    features = np.array([[hour, day_of_week, distance_km, is_holiday, weather_code]], dtype=float)
    class_id = int(model.predict(features)[0])
    proba = model.predict_proba(features)[0]
    confidence = float(proba[class_id])

    return {
        "level": TRAFFIC_LABELS.get(class_id, "medium"),
        "class_id": class_id,
        "confidence": round(confidence, 3),
        "factors": _build_factors(hour, day_of_week, is_holiday, weather_code),
        "source": "ml_model",
    }


def _rule_based_prediction(
    hour: int,
    day_of_week: int,
    is_holiday: int,
    weather_code: int,
) -> dict[str, Any]:
    """
    Deterministic fallback rule engine for traffic prediction.

    Rules:
    - Holiday → always low
    - Weekday morning rush (7-9) or evening rush (17-19) → high
    - Weekday off-peak → medium
    - Weekend → low/medium
    - Rain or fog adds pressure
    """
    if is_holiday:
        level, confidence = "low", 0.90
    elif day_of_week in (5, 6):  # Saturday, Sunday
        if 10 <= hour <= 14:
            level, confidence = "medium", 0.78
        else:
            level, confidence = "low", 0.85
    elif (7 <= hour <= 9) or (17 <= hour <= 19):
        level, confidence = "high", 0.88
    elif (9 < hour < 17) or (19 < hour <= 21):
        level, confidence = "medium", 0.75
    else:
        level, confidence = "low", 0.83

    # Weather adjustment
    if weather_code in (2, 3) and level != "high":  # rain or fog
        level_map = {"low": "medium", "medium": "high"}
        level = level_map.get(level, level)
        confidence = max(0.55, confidence - 0.10)

    class_map = {"low": 0, "medium": 1, "high": 2}
    return {
        "level": level,
        "class_id": class_map[level],
        "confidence": round(confidence, 3),
        "factors": _build_factors(hour, day_of_week, is_holiday, weather_code),
        "source": "rule_based",
    }


def _build_factors(
    hour: int,
    day_of_week: int,
    is_holiday: int,
    weather_code: int,
) -> dict[str, Any]:
    """Build a human-readable factor summary for XAI display."""
    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    weather_names = {0: "Clear", 1: "Cloudy", 2: "Rainy", 3: "Foggy"}
    return {
        "hour": hour,
        "day": day_names[day_of_week % 7],
        "is_rush_hour": (7 <= hour <= 9) or (17 <= hour <= 19),
        "is_weekend": day_of_week in (5, 6),
        "is_holiday": bool(is_holiday),
        "weather": weather_names.get(weather_code, "Unknown"),
    }


def get_traffic_for_route(
    source_lat: float,
    source_lon: float,
    hour: int,
    day_of_week: int,
    distance_km: float = 10.0,
) -> dict[str, Any]:
    """
    Predict traffic conditions for a specific route origin and time.

    Args:
        source_lat:   Origin latitude.
        source_lon:   Origin longitude.
        hour:         Hour of day.
        day_of_week:  0=Monday, 6=Sunday.
        distance_km:  Route distance for context.

    Returns:
        Traffic prediction dict enriched with location context.
    """
    prediction = predict_traffic(
        hour=hour,
        day_of_week=day_of_week,
        distance_km=distance_km,
    )
    prediction["location"] = {"lat": source_lat, "lon": source_lon}
    return prediction
