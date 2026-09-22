from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.ad_completion import AdCompletion
from app.services.ad_completion_queries import (
    completion_query,
    completed_campaign_ids,
    get_flow_status,
    has_valid_completion,
)
from app.services.ad_gates import VALID_GATES
from app.services.gate_video import get_or_create_system_gate_campaign

__all__ = [
    "has_valid_completion",
    "get_flow_status",
    "completed_campaign_ids",
    "record_completion",
]


def record_completion(
    db: Session,
    mobile: str | None,
    token: str | None,
    watch_duration: int,
    gate: str,
) -> AdCompletion:
    if gate not in VALID_GATES:
        raise HTTPException(status_code=400, detail="Invalid ad gate")

    from app.services.watch_context import resolve_watch_context

    settings = get_settings()
    ctx = resolve_watch_context(db, token, mobile, gate)

    if watch_duration < ctx.min_watch_seconds:
        raise HTTPException(
            status_code=400,
            detail=f"Watch at least {ctx.min_watch_seconds} seconds",
        )

    now = datetime.now(timezone.utc)
    expires = now + timedelta(minutes=settings.ad_completion_ttl_minutes)

    gate_video_id = None
    if ctx.gate_video and ctx.gate_video.id:
        gate_video_id = ctx.gate_video.id

    if ctx.campaign:
        campaign_id = ctx.campaign.id
    elif ctx.gate_video:
        campaign_id = get_or_create_system_gate_campaign(db).id
    else:
        raise HTTPException(status_code=404, detail="No ad content")

    existing = completion_query(db, ctx.user.id, ctx.token_val, gate).first()
    if existing:
        existing.campaign_id = campaign_id
        existing.location_gate_video_id = gate_video_id
        existing.watch_duration = watch_duration
        existing.completed_at = now
        existing.expires_at = expires
        db.commit()
        db.refresh(existing)
        return existing

    row = AdCompletion(
        user_id=ctx.user.id,
        campaign_id=campaign_id,
        location_gate_video_id=gate_video_id,
        token=ctx.token_val,
        gate=gate,
        watch_duration=watch_duration,
        completed_at=now,
        expires_at=expires,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row
