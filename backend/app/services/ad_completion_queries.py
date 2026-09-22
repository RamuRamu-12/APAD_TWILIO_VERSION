"""Read-only ad completion queries (no watch_context / ad_context imports)."""

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.ad_completion import AdCompletion
from app.services.ad_gates import GATE_LOGIN, GATE_OTP_REQUEST


def completion_query(db: Session, user_id: int, token: str | None, gate: str):
    now = datetime.now(timezone.utc)
    q = db.query(AdCompletion).filter(
        AdCompletion.user_id == user_id,
        AdCompletion.gate == gate,
        AdCompletion.expires_at > now,
    )
    if token:
        q = q.filter(AdCompletion.token == token)
    return q


def has_valid_completion(
    db: Session, user_id: int, token: str | None, gate: str = GATE_OTP_REQUEST
) -> bool:
    return completion_query(db, user_id, token, gate).first() is not None


def get_flow_status(db: Session, user_id: int, token: str | None) -> dict:
    return {
        "login_ad_completed": has_valid_completion(db, user_id, token, GATE_LOGIN),
        "otp_ad_completed": has_valid_completion(db, user_id, token, GATE_OTP_REQUEST),
    }


def completed_campaign_ids(
    db: Session, user_id: int, token: str | None, gate: str
) -> list[int]:
    now = datetime.now(timezone.utc)
    q = db.query(AdCompletion.campaign_id).filter(
        AdCompletion.user_id == user_id,
        AdCompletion.gate == gate,
        AdCompletion.expires_at > now,
        AdCompletion.campaign_id.isnot(None),
    )
    if token:
        q = q.filter(AdCompletion.token == token)
    return [row[0] for row in q.all()]
