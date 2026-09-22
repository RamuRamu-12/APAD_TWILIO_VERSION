from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.campaign import Campaign
from app.models.location_gate_video import GLOBAL_GATE_VIDEO_AREA, LocationGateVideo
from app.models.user import User
from app.utils.youtube import extract_youtube_video_id, youtube_thumbnail_url

DEFAULT_MASTERCARD_URL = "https://youtu.be/7gqCmeALTuk"
DEFAULT_MASTERCARD_TITLE = "Mastercard — Priceless"
SYSTEM_GATE_CAMPAIGN_NAME = "System Gate Video"


def get_or_create_system_gate_campaign(db: Session) -> Campaign:
    row = (
        db.query(Campaign)
        .filter(Campaign.name == SYSTEM_GATE_CAMPAIGN_NAME)
        .first()
    )
    if row:
        return row
    row = Campaign(
        name=SYSTEM_GATE_CAMPAIGN_NAME,
        title_template="Sponsored message",
        description="YouTube gate ad",
        image_url=youtube_thumbnail_url(extract_youtube_video_id(DEFAULT_MASTERCARD_URL) or ""),
        creative_url=DEFAULT_MASTERCARD_URL,
        creative_type="youtube",
        min_watch_seconds=5,
        priority=0,
        is_active=True,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def seed_location_gate_videos(db: Session) -> None:
    get_or_create_system_gate_campaign(db)
    global_row = (
        db.query(LocationGateVideo)
        .filter(LocationGateVideo.area == GLOBAL_GATE_VIDEO_AREA)
        .first()
    )
    if global_row is None:
        db.add(
            LocationGateVideo(
                area=GLOBAL_GATE_VIDEO_AREA,
                youtube_url=DEFAULT_MASTERCARD_URL,
                title=DEFAULT_MASTERCARD_TITLE,
                min_watch_seconds=5,
                is_active=True,
            )
        )
        db.commit()


def resolve_gate_video(db: Session, user: User) -> LocationGateVideo:
    area = (user.area or "").strip()
    if area:
        row = (
            db.query(LocationGateVideo)
            .filter(
                func.lower(LocationGateVideo.area) == area.lower(),
                LocationGateVideo.is_active.is_(True),
            )
            .first()
        )
        if row and row.youtube_url.strip():
            return row

    fallback = (
        db.query(LocationGateVideo)
        .filter(
            LocationGateVideo.area == GLOBAL_GATE_VIDEO_AREA,
            LocationGateVideo.is_active.is_(True),
        )
        .first()
    )
    if fallback:
        return fallback

    return LocationGateVideo(
        id=0,
        area=GLOBAL_GATE_VIDEO_AREA,
        youtube_url=DEFAULT_MASTERCARD_URL,
        title=DEFAULT_MASTERCARD_TITLE,
        min_watch_seconds=5,
        is_active=True,
    )


def build_gate_watch_payload(user: User, video: LocationGateVideo, gate: str) -> dict:
    video_id = extract_youtube_video_id(video.youtube_url) or ""
    title = video.title or DEFAULT_MASTERCARD_TITLE
    user_area = (user.area or "").strip()
    location_name = (
        user_area if video.area == GLOBAL_GATE_VIDEO_AREA else video.area
    )
    return {
        "gate": gate,
        "campaign_id": 0,
        "location_gate_video_id": video.id if video.id else None,
        "campaign_name": title,
        "user_mobile": user.mobile,
        "user_name": user.name,
        "personalized_title": title,
        "description": f"Exclusive message for {user.name}",
        "image_url": youtube_thumbnail_url(video_id) if video_id else "",
        "creative_url": video.youtube_url.strip(),
        "creative_type": "youtube",
        "min_watch_seconds": video.min_watch_seconds,
        "location_name": location_name or None,
    }
