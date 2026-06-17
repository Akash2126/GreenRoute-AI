"""
routers/achievements.py - Achievements router for GreenRoute AI
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models.achievement import Achievement, UserAchievement
from models.user import User
from routers.auth import get_current_user

router = APIRouter(prefix="/api/achievements", tags=["Achievements"])

# ---------------------------------------------------------------------------
# Achievement catalog (seeded at startup)
# ---------------------------------------------------------------------------

ACHIEVEMENT_CATALOG = [
    {
        "name": "First Journey",
        "description": "Complete your very first eco-routed trip.",
        "icon": "🚀",
        "category": "trips",
        "threshold": 1.0,
        "unit": "trips",
    },
    {
        "name": "Road Warrior",
        "description": "Complete 10 eco-routed trips.",
        "icon": "🛣️",
        "category": "trips",
        "threshold": 10.0,
        "unit": "trips",
    },
    {
        "name": "Mile Master",
        "description": "Complete 50 eco-routed trips.",
        "icon": "🏆",
        "category": "trips",
        "threshold": 50.0,
        "unit": "trips",
    },
    {
        "name": "Century Traveller",
        "description": "Complete 100 eco-routed trips.",
        "icon": "💯",
        "category": "trips",
        "threshold": 100.0,
        "unit": "trips",
    },
    {
        "name": "Carbon Saver",
        "description": "Save 10 kg of CO₂ through eco-routing.",
        "icon": "🌿",
        "category": "emissions",
        "threshold": 10.0,
        "unit": "kg",
    },
    {
        "name": "Climate Champion",
        "description": "Save 100 kg of CO₂ through eco-routing.",
        "icon": "🌍",
        "category": "emissions",
        "threshold": 100.0,
        "unit": "kg",
    },
    {
        "name": "Fuel Frugalist",
        "description": "Save 50 litres of fuel through eco-routing.",
        "icon": "⛽",
        "category": "fuel",
        "threshold": 50.0,
        "unit": "litres",
    },
    {
        "name": "Eco Legend",
        "description": "Achieve an average EcoScore of 80 or above.",
        "icon": "🌟",
        "category": "ecoscore",
        "threshold": 80.0,
        "unit": "score",
    },
    {
        "name": "Green Starter",
        "description": "Save your first litre of fuel.",
        "icon": "🌱",
        "category": "fuel",
        "threshold": 1.0,
        "unit": "litres",
    },
    {
        "name": "Tree Planter",
        "description": "Save enough CO₂ to offset one tree (22 kg).",
        "icon": "🌳",
        "category": "emissions",
        "threshold": 22.0,
        "unit": "kg",
    },
]


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class AchievementResponse(BaseModel):
    id: int
    name: str
    description: str
    icon: str
    category: str
    threshold: float
    unit: str

    model_config = {"from_attributes": True}


class UserAchievementResponse(BaseModel):
    achievement: AchievementResponse
    earned: bool
    earned_at: datetime | None
    progress: float

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _compute_progress(user: User, achievement: Achievement) -> float:
    """Compute progress (0.0–1.0) toward an achievement threshold."""
    cat = achievement.category
    threshold = achievement.threshold

    if cat == "trips":
        value = user.total_trips
    elif cat == "emissions":
        value = user.total_co2_saved
    elif cat == "fuel":
        value = user.total_fuel_saved
    elif cat == "ecoscore":
        value = user.avg_ecoscore
    else:
        value = 0.0

    return min(1.0, value / threshold) if threshold > 0 else 0.0


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/", response_model=list[UserAchievementResponse])
def get_user_achievements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    """
    Return the authenticated user's achievements with earned status and progress.
    If user achievements haven't been initialised yet, create skeleton entries.
    """
    all_achievements = db.query(Achievement).all()
    existing = {
        ua.achievement_id: ua
        for ua in db.query(UserAchievement)
        .filter(UserAchievement.user_id == current_user.id)
        .all()
    }

    results = []
    for ach in all_achievements:
        ua = existing.get(ach.id)
        progress = _compute_progress(current_user, ach)
        earned = progress >= 1.0

        if ua is None:
            # Create skeleton record
            ua = UserAchievement(
                user_id=current_user.id,
                achievement_id=ach.id,
                progress=progress,
                earned_at=datetime.now(timezone.utc) if earned else None,
            )
            db.add(ua)
        else:
            # Update progress
            ua.progress = progress
            if earned and ua.earned_at is None:
                ua.earned_at = datetime.now(timezone.utc)

        results.append(
            {
                "achievement": ach,
                "earned": earned,
                "earned_at": ua.earned_at,
                "progress": progress,
            }
        )

    db.commit()
    return results


@router.get("/all", response_model=list[AchievementResponse])
def get_all_achievements(
    db: Session = Depends(get_db),
) -> list[Achievement]:
    """Return the full achievement catalog (no auth required)."""
    return db.query(Achievement).order_by(Achievement.id).all()


@router.post("/seed", status_code=201)
def seed_achievements(db: Session = Depends(get_db)) -> dict[str, Any]:
    """
    Seed the achievement catalog with predefined entries.
    Idempotent – skips achievements that already exist by name.
    """
    created = 0
    for item in ACHIEVEMENT_CATALOG:
        existing = db.query(Achievement).filter(Achievement.name == item["name"]).first()
        if existing is None:
            db.add(Achievement(**item))
            created += 1

    db.commit()
    total = db.query(Achievement).count()
    return {
        "message": "Achievement catalog seeded.",
        "created": created,
        "total": total,
    }
