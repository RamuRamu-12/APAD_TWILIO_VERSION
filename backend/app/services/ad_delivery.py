from app.models.campaign import Campaign
from app.models.user import User
from app.services.ad_context import resolve_context, resolve_context_for_gate
from app.services.gate_video import build_gate_watch_payload
from app.services.og_metadata import personalize
from app.services.watch_context import WatchContext

__all__ = [
    "resolve_context",
    "resolve_context_for_gate",
    "get_watch_payload",
    "get_watch_payload_from_context",
]


def get_watch_payload(user: User, campaign: Campaign, gate: str) -> dict:
    return {
        "gate": gate,
        "campaign_id": campaign.id,
        "location_gate_video_id": None,
        "campaign_name": campaign.name,
        "user_mobile": user.mobile,
        "user_name": user.name,
        "personalized_title": personalize(campaign.title_template, user.name),
        "description": personalize(campaign.description, user.name),
        "image_url": campaign.image_url,
        "creative_url": campaign.creative_url,
        "creative_type": campaign.creative_type,
        "min_watch_seconds": campaign.min_watch_seconds,
        "location_name": (user.area or "").strip() or None,
    }


def get_watch_payload_from_context(ctx: WatchContext) -> dict:
    if ctx.gate_video:
        return build_gate_watch_payload(ctx.user, ctx.gate_video, ctx.gate)
    if ctx.campaign:
        return get_watch_payload(ctx.user, ctx.campaign, ctx.gate)
    raise ValueError("WatchContext has no campaign or gate video")
