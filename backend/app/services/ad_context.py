"""Resolve user + campaign for an ad gate (legacy campaign path)."""

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.campaign import Campaign
from app.models.user import User
from app.services.ad_completion_queries import completed_campaign_ids, has_valid_completion
from app.services.ad_gates import GATE_EMAIL, GATE_LOGIN, GATE_OTP_REQUEST, VALID_GATES
from app.services.ad_resolve_helpers import (
    campaign_from_token,
    load_user_from_token,
    normalize_mobile_param,
    resolve_user,
)
from app.services.audience_matching import select_campaign_for_user


def _campaign_for_gate(
    db: Session, user: User, gate: str, token_val: str | None
) -> Campaign:
    if token_val:
        bound = campaign_from_token(db, token_val)
        if bound:
            if gate == GATE_OTP_REQUEST:
                exclude = completed_campaign_ids(db, user.id, token_val, GATE_LOGIN)
                if bound.id in exclude:
                    pass
                else:
                    return bound
            else:
                return bound

    exclude: list[int] = []
    if gate == GATE_OTP_REQUEST:
        exclude = completed_campaign_ids(db, user.id, token_val, GATE_LOGIN)

    campaign = select_campaign_for_user(db, user, exclude_ids=exclude or None)
    if not campaign:
        raise HTTPException(status_code=404, detail="No active campaign")
    return campaign


def resolve_context_for_gate(
    db: Session, token: str | None, mobile: str | None, gate: str
) -> tuple[User, Campaign, str | None]:
    mobile = normalize_mobile_param(mobile)
    if gate not in VALID_GATES:
        raise HTTPException(status_code=400, detail="Invalid ad gate")

    if gate == GATE_EMAIL:
        if not token:
            raise HTTPException(status_code=400, detail="Token required for campaign link")
        user = load_user_from_token(db, token)
        campaign = campaign_from_token(db, token)
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not available")
        return user, campaign, token

    if gate == GATE_OTP_REQUEST:
        user = resolve_user(db, token, mobile)
        token_val = token if token else None
        if not has_valid_completion(db, user.id, token_val, GATE_LOGIN):
            raise HTTPException(
                status_code=403,
                detail="Please finish watching the offer before continuing",
            )
        return user, _campaign_for_gate(db, user, gate, token_val), token_val

    user = resolve_user(db, token, mobile)
    return user, _campaign_for_gate(db, user, gate, token if token else None), (
        token if token else None
    )


def resolve_context(
    db: Session, token: str | None, mobile: str | None
) -> tuple[User, Campaign, str | None]:
    return resolve_context_for_gate(db, token, mobile, GATE_LOGIN)
