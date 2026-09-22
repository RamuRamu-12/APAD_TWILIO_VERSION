from dataclasses import dataclass

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.campaign import Campaign
from app.models.location_gate_video import LocationGateVideo
from app.models.user import User
from app.services.ad_completion_queries import completed_campaign_ids, has_valid_completion
from app.services.ad_gates import GATE_EMAIL, GATE_LOGIN, GATE_OTP_REQUEST, VALID_GATES
from app.services.ad_resolve_helpers import (
    campaign_from_token,
    load_user_from_token,
    normalize_mobile_param,
    resolve_user,
)
from app.services.gate_video import resolve_gate_video


@dataclass
class WatchContext:
    user: User
    token_val: str | None
    gate: str
    campaign: Campaign | None = None
    gate_video: LocationGateVideo | None = None

    @property
    def min_watch_seconds(self) -> int:
        if self.gate_video:
            return self.gate_video.min_watch_seconds
        if self.campaign:
            return self.campaign.min_watch_seconds
        return 5

    @property
    def uses_gate_video(self) -> bool:
        return self.gate_video is not None


def resolve_watch_context(
    db: Session, token: str | None, mobile: str | None, gate: str
) -> WatchContext:
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
        return WatchContext(user=user, token_val=token, gate=gate, campaign=campaign)

    user = resolve_user(db, token, mobile)
    token_val = token if token else None

    if gate == GATE_OTP_REQUEST:
        if not has_valid_completion(db, user.id, token_val, GATE_LOGIN):
            raise HTTPException(
                status_code=403,
                detail="Please finish watching the offer before continuing",
            )
        if token_val:
            bound = campaign_from_token(db, token_val)
            if bound:
                exclude = completed_campaign_ids(db, user.id, token_val, GATE_LOGIN)
                if bound.id not in exclude:
                    return WatchContext(
                        user=user,
                        token_val=token_val,
                        gate=gate,
                        campaign=bound,
                    )
        video = resolve_gate_video(db, user)
        return WatchContext(
            user=user, token_val=token_val, gate=gate, gate_video=video
        )

    if token_val:
        bound = campaign_from_token(db, token_val)
        if bound:
            return WatchContext(
                user=user, token_val=token_val, gate=gate, campaign=bound
            )

    video = resolve_gate_video(db, user)
    return WatchContext(user=user, token_val=token_val, gate=gate, gate_video=video)
