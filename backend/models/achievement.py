"""
models/achievement.py - Achievement and UserAchievement ORM models for GreenRoute AI
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from database import Base


class Achievement(Base):
    """
    Catalog of all available achievements users can earn.
    """
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), unique=True, nullable=False)
    description = Column(String(500), nullable=False)
    icon = Column(String(100), nullable=False)           # emoji or icon identifier
    category = Column(String(100), nullable=False)       # trips | emissions | ecoscore | fuel
    threshold = Column(Float, nullable=False)            # numeric milestone value
    unit = Column(String(50), nullable=False)            # kg | litres | trips | score

    # Relationships
    user_achievements = relationship("UserAchievement", back_populates="achievement")

    def __repr__(self) -> str:
        return f"<Achievement id={self.id} name={self.name!r} category={self.category!r}>"


class UserAchievement(Base):
    """
    Junction table tracking which achievements a user has earned
    and the progress toward not-yet-earned achievements.
    """
    __tablename__ = "user_achievements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    achievement_id = Column(Integer, ForeignKey("achievements.id", ondelete="CASCADE"), nullable=False, index=True)
    earned_at = Column(DateTime, nullable=True)          # None if not yet earned
    progress = Column(Float, default=0.0, nullable=False)  # 0.0 - 1.0

    # Relationships
    user = relationship("User", back_populates="user_achievements")
    achievement = relationship("Achievement", back_populates="user_achievements")

    def __repr__(self) -> str:
        return (
            f"<UserAchievement user_id={self.user_id} "
            f"achievement_id={self.achievement_id} progress={self.progress:.1%}>"
        )
