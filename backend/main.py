"""
main.py - FastAPI application entry point for GreenRoute AI

Features:
- CORS for localhost:5173 (Vite) and localhost:3000 (CRA/Next)
- Lifespan startup: create DB tables, seed achievements, pre-load ML models
- All routers mounted under /api
- Health check at GET /health
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Load .env before any other imports that read env vars
load_dotenv()

from database import create_tables
from routers import achievements as achievements_router
from routers import ai as ai_router
from routers import analytics as analytics_router
from routers import auth as auth_router
from routers import fleet as fleet_router
from routers import reports as reports_router
from routers import routes as routes_router
from routers.achievements import seed_achievements
from services import forecasting_service, traffic_prediction


# ---------------------------------------------------------------------------
# Lifespan (startup / shutdown)
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan handler.

    On startup:
    1. Create all SQLite tables.
    2. Seed the achievement catalog (idempotent).
    3. Pre-load ML models into memory.
    """
    print("[GreenRoute AI] Starting up...")

    # 1. Create DB tables
    create_tables()
    print("[GreenRoute AI] Database tables ready.")

    # 2. Seed achievements
    from database import SessionLocal
    from models.user import User
    from routers.auth import _hash_password

    db = SessionLocal()
    try:
        seed_achievements(db)
        print("[GreenRoute AI] Achievement catalog seeded.")

        # Seed demo user
        demo_user = db.query(User).filter(User.email == "demo@greenroute.ai").first()
        if not demo_user:
            demo_user = User(
                email="demo@greenroute.ai",
                username="demouser",
                hashed_password=_hash_password("demo123"),
                total_trips=0,
                total_co2_saved=0.0,
                total_fuel_saved=0.0,
                avg_ecoscore=0.0,
            )
            db.add(demo_user)
            db.commit()
            print("[GreenRoute AI] Demo user seeded.")
    finally:
        db.close()

    # 3. Pre-load ML models
    traffic_prediction.load_model()
    forecasting_service.load_model()
    print("[GreenRoute AI] ML models loaded.")

    yield  # App is running

    print("[GreenRoute AI] Shutting down.")


# ---------------------------------------------------------------------------
# Application factory
# ---------------------------------------------------------------------------

def create_app() -> FastAPI:
    app = FastAPI(
        title="GreenRoute AI",
        description=(
            "Sustainable route planning powered by AI/ML. "
            "Reduces carbon footprint through eco-optimised routing, "
            "emission analytics, and personalised sustainability insights."
        ),
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # ---- CORS ----
    allowed_origins = [
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # CRA / Next.js
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ---- Routers ----
    app.include_router(auth_router.router)
    app.include_router(routes_router.router)
    app.include_router(analytics_router.router)
    app.include_router(ai_router.router)
    app.include_router(fleet_router.router)
    app.include_router(achievements_router.router)
    app.include_router(reports_router.router)

    # ---- Health check ----
    @app.get("/health", tags=["Health"])
    def health_check() -> JSONResponse:
        """Returns 200 OK when the application is running."""
        return JSONResponse(
            content={
                "status": "ok",
                "service": "GreenRoute AI Backend",
                "version": "1.0.0",
            }
        )

    # ---- Root ----
    @app.get("/", tags=["Root"])
    def root() -> JSONResponse:
        return JSONResponse(
            content={
                "message": "Welcome to GreenRoute AI API. Visit /docs for the interactive API reference.",
                "docs": "/docs",
                "health": "/health",
            }
        )

    return app


app = create_app()

# ---------------------------------------------------------------------------
# Standalone run
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
