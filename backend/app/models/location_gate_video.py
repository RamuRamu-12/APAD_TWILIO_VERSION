from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base

GLOBAL_GATE_VIDEO_AREA = "*"


class LocationGateVideo(Base):
    """YouTube (or URL) shown on login / OTP ad gates, keyed by registration area."""

    __tablename__ = "location_gate_videos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    area: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    youtube_url: Mapped[str] = mapped_column(String(500))
    title: Mapped[str] = mapped_column(String(255), default="Sponsored message")
    min_watch_seconds: Mapped[int] = mapped_column(Integer, default=5)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
