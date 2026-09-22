"""Token / user resolution for ad gates (no imports from completion or watch context)."""

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.models.campaign import Campaign
from app.models.generated_token import GeneratedToken
from app.models.user import User
from app.utils.phone import normalize_mobile


def normalize_mobile_param(mobile: str | None) -> str | None:
    if not mobile:
        return None
    try:
        return normalize_mobile(mobile)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid mobile number") from exc


def load_token_row(db: Session, token: str) -> GeneratedToken:
    row = db.query(GeneratedToken).filter(GeneratedToken.token == token).first()
    if not row:
        raise HTTPException(status_code=404, detail="Invalid token")
    return row


def load_user_from_token(db: Session, token: str) -> User:
    row = load_token_row(db, token)
    user = db.query(User).filter(User.id == row.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def campaign_from_token(db: Session, token: str) -> Campaign | None:
    row = load_token_row(db, token)
    return (
        db.query(Campaign)
        .options(joinedload(Campaign.targeting_rules))
        .filter(Campaign.id == row.campaign_id, Campaign.is_active.is_(True))
        .first()
    )


def resolve_user(db: Session, token: str | None, mobile: str | None) -> User:
    if token:
        return load_user_from_token(db, token)
    if mobile:
        user = db.query(User).filter(User.mobile == mobile).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    raise HTTPException(status_code=400, detail="Provide token or mobile")
