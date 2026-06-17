"""
services/forecasting_service.py - LSTM/ML forecasting service for GreenRoute AI

Tries to load a pre-trained sklearn MLPRegressor from ml_models/lstm_forecast_model.pkl.
Falls back to a deterministic synthetic generator when the file is absent.
"""

from __future__ import annotations

import math
import os
import random
from datetime import datetime, timedelta, timezone
from typing import Any

import numpy as np

# ---------------------------------------------------------------------------
# Module-level model cache
# ---------------------------------------------------------------------------
_forecast_model = None
_scaler = None
_model_load_attempted = False

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "ml_models", "lstm_forecast_model.pkl")
SCALER_PATH = os.path.join(os.path.dirname(__file__), "..", "ml_models", "scaler.pkl")


def load_model() -> tuple[Any | None, Any | None]:
    """
    Load the MLP forecast model and scaler from disk (once).

    Returns:
        (model, scaler) or (None, None) if files are absent.
    """
    global _forecast_model, _scaler, _model_load_attempted
    if _model_load_attempted:
        return _forecast_model, _scaler

    _model_load_attempted = True
    try:
        import joblib

        _forecast_model = joblib.load(MODEL_PATH)
        _scaler = joblib.load(SCALER_PATH)
        print(f"[ForecastService] MLP model loaded from {MODEL_PATH}")
    except (FileNotFoundError, Exception) as exc:
        print(f"[ForecastService] Forecast model not found, using synthetic generator. ({exc})")
        _forecast_model = None
        _scaler = None

    return _forecast_model, _scaler


# ---------------------------------------------------------------------------
# Synthetic pattern helpers
# ---------------------------------------------------------------------------

def _traffic_pattern(hour: int, dow: int) -> float:
    """
    Return a normalised traffic intensity in [0, 1] based on time patterns.
    - Weekday rush hours: 0.8-1.0
    - Weekend daytime: 0.4-0.6
    - Night: 0.1-0.2
    """
    is_weekend = dow in (5, 6)
    if is_weekend:
        if 10 <= hour <= 14:
            return 0.5 + 0.1 * math.sin((hour - 10) * math.pi / 4)
        return 0.25
    # Weekday
    morning_rush = math.exp(-0.5 * ((hour - 8.5) / 1.0) ** 2)
    evening_rush = math.exp(-0.5 * ((hour - 18.0) / 1.2) ** 2)
    return min(1.0, morning_rush * 0.9 + evening_rush * 0.85 + 0.10)


def _co2_for_traffic(intensity: float, base_co2: float = 1.8) -> float:
    """CO2 kg/h increases with traffic intensity."""
    return round(base_co2 * (0.7 + intensity * 0.6), 4)


def _fuel_for_traffic(intensity: float, base_fuel: float = 0.8) -> float:
    """Fuel L/h increases with traffic intensity."""
    return round(base_fuel * (0.7 + intensity * 0.5), 4)


def _ecoscore_for_traffic(intensity: float) -> float:
    """EcoScore decreases as traffic intensity rises."""
    return round(80.0 - intensity * 40.0, 2)


def _traffic_level_str(intensity: float) -> str:
    if intensity >= 0.65:
        return "high"
    elif intensity >= 0.35:
        return "medium"
    return "low"


def generate_synthetic_forecast(
    horizon_hours: int,
    start_dt: datetime | None = None,
) -> list[dict[str, Any]]:
    """
    Generate a realistic synthetic time-series forecast.

    Args:
        horizon_hours: Number of hourly data points to generate.
        start_dt:      Starting datetime (defaults to now UTC).

    Returns:
        List of hourly dicts with timestamp, traffic_level, co2_kg, fuel_l,
        ecoscore, confidence.
    """
    if start_dt is None:
        start_dt = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)

    results = []
    for i in range(horizon_hours):
        dt = start_dt + timedelta(hours=i)
        hour = dt.hour
        dow = dt.weekday()

        intensity = _traffic_pattern(hour, dow)
        # Add small noise
        noise = random.gauss(0, 0.03)
        intensity = max(0.0, min(1.0, intensity + noise))

        # Confidence degrades for longer horizons
        confidence = max(0.40, 0.95 - i * 0.008)

        results.append(
            {
                "timestamp": dt.isoformat(),
                "hour": hour,
                "day_of_week": dow,
                "traffic_level": _traffic_level_str(intensity),
                "traffic_intensity": round(intensity, 3),
                "co2_kg": _co2_for_traffic(intensity),
                "fuel_l": _fuel_for_traffic(intensity),
                "ecoscore": _ecoscore_for_traffic(intensity),
                "confidence": round(confidence, 3),
            }
        )

    return results


# ---------------------------------------------------------------------------
# Public forecast APIs
# ---------------------------------------------------------------------------

def forecast_next_hour() -> dict[str, Any]:
    """Generate a single next-hour forecast."""
    data = generate_synthetic_forecast(1)
    return data[0] if data else {}


def forecast_next_24h() -> list[dict[str, Any]]:
    """Generate 24 hourly forecast data points."""
    return generate_synthetic_forecast(24)


def forecast_7_days() -> list[dict[str, Any]]:
    """
    Generate 7 daily aggregate forecasts.

    Returns:
        One dict per day (mean of 24 hourly points).
    """
    hourly = generate_synthetic_forecast(7 * 24)
    return _aggregate_daily(hourly, 7)


def forecast_30_days() -> list[dict[str, Any]]:
    """Generate 30 daily aggregate forecasts."""
    hourly = generate_synthetic_forecast(30 * 24)
    return _aggregate_daily(hourly, 30)


def forecast_90_days() -> list[dict[str, Any]]:
    """Generate 90 daily aggregate forecasts."""
    hourly = generate_synthetic_forecast(90 * 24)
    return _aggregate_daily(hourly, 90)


def _aggregate_daily(hourly: list[dict[str, Any]], n_days: int) -> list[dict[str, Any]]:
    """
    Aggregate hourly forecast data into daily summaries.

    Each day's entry uses mean traffic intensity, total CO2/fuel,
    mean ecoscore, and minimum confidence.
    """
    daily: list[dict[str, Any]] = []
    for d in range(n_days):
        chunk = hourly[d * 24 : (d + 1) * 24]
        if not chunk:
            break

        date_str = chunk[0]["timestamp"][:10]
        intensities = [h["traffic_intensity"] for h in chunk]
        avg_intensity = float(np.mean(intensities))

        daily.append(
            {
                "timestamp": date_str,
                "traffic_level": _traffic_level_str(avg_intensity),
                "traffic_intensity": round(avg_intensity, 3),
                "co2_kg": round(sum(h["co2_kg"] for h in chunk), 4),
                "fuel_l": round(sum(h["fuel_l"] for h in chunk), 4),
                "ecoscore": round(float(np.mean([h["ecoscore"] for h in chunk])), 2),
                "confidence": round(float(np.min([h["confidence"] for h in chunk])), 3),
            }
        )

    return daily
