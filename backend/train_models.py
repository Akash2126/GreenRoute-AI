"""
train_models.py - Offline ML training script for GreenRoute AI

Run this script ONCE before starting the server to train and save the ML models:

    python train_models.py

Models trained:
1. RandomForestClassifier → ml_models/rf_traffic_model.pkl
2. Feature importances    → ml_models/rf_feature_importances.json
3. MLPRegressor (LSTM alt)→ ml_models/lstm_forecast_model.pkl
4. StandardScaler         → ml_models/scaler.pkl

This script is standalone and NOT imported by the FastAPI app.
"""

from __future__ import annotations

import json
import os
import time

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    mean_absolute_error,
    r2_score,
)
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPRegressor
from sklearn.preprocessing import StandardScaler

# ---------------------------------------------------------------------------
# Directories
# ---------------------------------------------------------------------------

ML_DIR = os.path.join(os.path.dirname(__file__), "ml_models")
os.makedirs(ML_DIR, exist_ok=True)

# ---------------------------------------------------------------------------
# Reproducibility
# ---------------------------------------------------------------------------

SEED = 42
rng = np.random.default_rng(SEED)


# ---------------------------------------------------------------------------
# 1. Traffic dataset generation
# ---------------------------------------------------------------------------

def _traffic_label(hour: int, dow: int, is_holiday: int, weather_code: int) -> int:
    """
    Assign a ground-truth traffic label:
    0 = Low, 1 = Medium, 2 = High
    """
    if is_holiday:
        # Holidays are generally low traffic
        if 10 <= hour <= 14:
            base = 1  # medium midday
        else:
            base = 0
    elif dow in (5, 6):  # Weekend
        if 10 <= hour <= 14:
            base = 1
        else:
            base = 0
    elif (7 <= hour <= 9) or (17 <= hour <= 19):
        base = 2  # weekday rush hours
    elif (9 < hour < 17) or (19 < hour <= 21):
        base = 1  # off-peak
    else:
        base = 0  # night

    # Weather makes things worse
    if weather_code in (2, 3):  # rain or fog
        base = min(2, base + 1)

    return base


def generate_traffic_dataset(n_samples: int = 10_000) -> tuple[np.ndarray, np.ndarray]:
    """
    Generate synthetic traffic dataset.

    Features (columns):
        0: hour (0-23)
        1: day_of_week (0-6)
        2: distance_km (1-200)
        3: is_holiday (0/1)
        4: weather_code (0-3)

    Labels:
        0: Low, 1: Medium, 2: High
    """
    print(f"[1/4] Generating {n_samples} traffic samples...")

    hours = rng.integers(0, 24, size=n_samples)
    days = rng.integers(0, 7, size=n_samples)
    distances = rng.uniform(1.0, 200.0, size=n_samples)
    holidays = rng.choice([0, 1], size=n_samples, p=[0.92, 0.08])
    weathers = rng.choice([0, 1, 2, 3], size=n_samples, p=[0.55, 0.25, 0.15, 0.05])

    X = np.column_stack([hours, days, distances, holidays, weathers]).astype(float)
    y = np.array(
        [_traffic_label(int(h), int(d), int(hol), int(w))
         for h, d, hol, w in zip(hours, days, holidays, weathers)],
        dtype=int,
    )

    # Add 5% label noise to improve generalisation
    noise_mask = rng.random(n_samples) < 0.05
    noise_labels = rng.integers(0, 3, size=noise_mask.sum())
    y[noise_mask] = noise_labels

    print(f"    Class distribution: low={np.sum(y==0)}, medium={np.sum(y==1)}, high={np.sum(y==2)}")
    return X, y


# ---------------------------------------------------------------------------
# 2. Train Random Forest
# ---------------------------------------------------------------------------

def train_random_forest(X: np.ndarray, y: np.ndarray) -> RandomForestClassifier:
    """Train and evaluate a RandomForestClassifier."""
    print("[2/4] Training RandomForestClassifier (n_estimators=100)...")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=SEED, stratify=y
    )

    t0 = time.time()
    rf = RandomForestClassifier(
        n_estimators=100,
        max_depth=12,
        min_samples_split=5,
        random_state=SEED,
        n_jobs=-1,
    )
    rf.fit(X_train, y_train)
    elapsed = time.time() - t0

    y_pred = rf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"    Training time: {elapsed:.1f}s")
    print(f"    Test accuracy: {acc:.4f} ({acc*100:.2f}%)")
    print("\n    Classification Report:")
    print(
        classification_report(
            y_test, y_pred, target_names=["Low", "Medium", "High"]
        )
    )

    return rf


# ---------------------------------------------------------------------------
# 3. Save RF model + feature importances
# ---------------------------------------------------------------------------

def save_rf_artifacts(rf: RandomForestClassifier) -> None:
    """Persist the RF model and feature importances to disk."""
    feature_names = ["hour", "day_of_week", "distance_km", "is_holiday", "weather_code"]
    importances = {
        name: round(float(imp) * 100, 2)
        for name, imp in zip(feature_names, rf.feature_importances_)
    }

    model_path = os.path.join(ML_DIR, "rf_traffic_model.pkl")
    json_path = os.path.join(ML_DIR, "rf_feature_importances.json")

    joblib.dump(rf, model_path, compress=3)
    with open(json_path, "w") as fh:
        json.dump(importances, fh, indent=2)

    print(f"\n    RF model saved -> {model_path}")
    print(f"    Importances saved -> {json_path}")
    print(f"    Feature importances: {importances}")


# ---------------------------------------------------------------------------
# 4. Forecast dataset generation (LSTM / MLP substitute)
# ---------------------------------------------------------------------------

def _traffic_intensity(hour: int, dow: int) -> float:
    """Return ground-truth traffic intensity [0,1] for forecast training."""
    import math

    is_weekend = dow in (5, 6)
    if is_weekend:
        return 0.25 + 0.20 * math.sin(max(0, (hour - 10)) * math.pi / 8)
    morning_rush = math.exp(-0.5 * ((hour - 8.5) / 1.0) ** 2)
    evening_rush = math.exp(-0.5 * ((hour - 18.0) / 1.2) ** 2)
    return min(1.0, morning_rush * 0.9 + evening_rush * 0.85 + 0.10)


def generate_forecast_dataset(
    n_sequences: int = 1000,
    seq_len: int = 24,
) -> tuple[np.ndarray, np.ndarray]:
    """
    Generate sequences for forecasting training.

    For each sequence:
        X: (hour, day_of_week, lag_1h_intensity, lag_2h_intensity, lag_3h_intensity)
        y: (next_hour_traffic_intensity, next_hour_co2_kg, next_hour_fuel_l, next_hour_ecoscore)
    """
    print(f"\n[3/4] Generating {n_sequences} forecast sequences (seq_len={seq_len})...")

    X_list, y_list = [], []

    for _ in range(n_sequences):
        # Random start day and hour
        start_dow = rng.integers(0, 7)
        start_hour = rng.integers(0, 24)

        for step in range(seq_len):
            hour = (start_hour + step) % 24
            dow = (start_dow + (start_hour + step) // 24) % 7

            # Compute intensities
            intensity_now = _traffic_intensity(hour, dow)
            intensity_lag1 = _traffic_intensity((hour - 1) % 24, dow)
            intensity_lag2 = _traffic_intensity((hour - 2) % 24, dow)
            intensity_lag3 = _traffic_intensity((hour - 3) % 24, dow)

            # Add noise
            noise = float(rng.normal(0, 0.02))
            intensity_now_noisy = float(np.clip(intensity_now + noise, 0, 1))

            next_hour = (hour + 1) % 24
            next_dow = (dow + 1) % 7 if next_hour == 0 else dow
            intensity_next = float(np.clip(_traffic_intensity(next_hour, next_dow) + float(rng.normal(0, 0.02)), 0, 1))

            # Derived outputs
            co2_next = 1.8 * (0.7 + intensity_next * 0.6)
            fuel_next = 0.8 * (0.7 + intensity_next * 0.5)
            ecoscore_next = 80.0 - intensity_next * 40.0

            X_list.append([
                hour / 23.0,          # normalised hour
                dow / 6.0,            # normalised day
                intensity_lag1,
                intensity_lag2,
                intensity_lag3,
            ])
            y_list.append([
                intensity_next,
                co2_next,
                fuel_next,
                ecoscore_next,
            ])

    X = np.array(X_list, dtype=float)
    y = np.array(y_list, dtype=float)
    print(f"    Forecast dataset: X={X.shape}, y={y.shape}")
    return X, y


# ---------------------------------------------------------------------------
# 5. Train MLP (LSTM substitute)
# ---------------------------------------------------------------------------

def train_mlp_forecaster(
    X: np.ndarray,
    y: np.ndarray,
) -> tuple[MLPRegressor, StandardScaler]:
    """Train an MLPRegressor as an LSTM substitute for forecasting."""
    print("[4/4] Training MLPRegressor forecaster...")

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.15, random_state=SEED
    )

    t0 = time.time()
    mlp = MLPRegressor(
        hidden_layer_sizes=(128, 64, 32),
        activation="relu",
        solver="adam",
        max_iter=300,
        random_state=SEED,
        early_stopping=True,
        validation_fraction=0.1,
        n_iter_no_change=20,
        verbose=False,
    )
    mlp.fit(X_train, y_train)
    elapsed = time.time() - t0

    y_pred = mlp.predict(X_test)

    mae_intensity = mean_absolute_error(y_test[:, 0], y_pred[:, 0])
    r2_intensity = r2_score(y_test[:, 0], y_pred[:, 0])
    mae_co2 = mean_absolute_error(y_test[:, 1], y_pred[:, 1])

    print(f"    Training time     : {elapsed:.1f}s")
    print(f"    Traffic intensity : MAE={mae_intensity:.4f}, R²={r2_intensity:.4f}")
    print(f"    CO2 (kg/h)        : MAE={mae_co2:.4f}")
    print(f"    Iterations        : {mlp.n_iter_}")

    return mlp, scaler


# ---------------------------------------------------------------------------
# 6. Save MLP + scaler
# ---------------------------------------------------------------------------

def save_mlp_artifacts(mlp: MLPRegressor, scaler: StandardScaler) -> None:
    """Persist the MLP model and scaler to disk."""
    mlp_path = os.path.join(ML_DIR, "lstm_forecast_model.pkl")
    scaler_path = os.path.join(ML_DIR, "scaler.pkl")

    joblib.dump(mlp, mlp_path, compress=3)
    joblib.dump(scaler, scaler_path, compress=3)

    print(f"\n    MLP model saved -> {mlp_path}")
    print(f"    Scaler saved    -> {scaler_path}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    print("=" * 60)
    print("  GreenRoute AI - ML Model Training Script")
    print("=" * 60)
    print(f"  Output directory: {ML_DIR}\n")

    total_start = time.time()

    # --- Traffic RF ---
    X_traffic, y_traffic = generate_traffic_dataset(10_000)
    rf_model = train_random_forest(X_traffic, y_traffic)
    save_rf_artifacts(rf_model)

    # --- Forecast MLP ---
    X_forecast, y_forecast = generate_forecast_dataset(1000, 24)
    mlp_model, scaler = train_mlp_forecaster(X_forecast, y_forecast)
    save_mlp_artifacts(mlp_model, scaler)

    elapsed = time.time() - total_start
    print("\n" + "=" * 60)
    print(f"  [OK] All models trained and saved in {elapsed:.1f}s")
    print("  Models saved:")
    for fname in os.listdir(ML_DIR):
        fpath = os.path.join(ML_DIR, fname)
        size_kb = os.path.getsize(fpath) / 1024
        print(f"    * {fname}  ({size_kb:.1f} KB)")
    print("=" * 60)
    print("\n  You can now start the GreenRoute AI backend:")
    print("  $ uvicorn main:app --reload\n")


if __name__ == "__main__":
    main()
