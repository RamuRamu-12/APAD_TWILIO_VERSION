from fastapi import APIRouter, Depends, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.campaign import Campaign
from app.models.generated_token import GeneratedToken
from app.models.user import User
from app.services import analytics_engine, og_metadata
from app.utils.user_agent import is_crawler

router = APIRouter(tags=["preview"])


def _campaign_for_token(db: Session, row: GeneratedToken) -> Campaign | None:
    return (
        db.query(Campaign)
        .options(joinedload(Campaign.targeting_rules))
        .filter(Campaign.id == row.campaign_id, Campaign.is_active.is_(True))
        .first()
    )


@router.get("/preview/{token}")
def preview_token(token: str, request: Request, db: Session = Depends(get_db)):
    row = db.query(GeneratedToken).filter(GeneratedToken.token == token).first()
    if not row:
        return HTMLResponse("<h1>Invalid link</h1>", status_code=404)

    user = db.query(User).filter(User.id == row.user_id).first()
    if not user:
        return HTMLResponse("<h1>Not found</h1>", status_code=404)

    campaign = _campaign_for_token(db, row)
    if not campaign:
        from app.services.audience_matching import select_campaign_for_user

        campaign = select_campaign_for_user(db, user)
    if not campaign:
        return HTMLResponse("<h1>No campaign available</h1>", status_code=404)

    ua = request.headers.get("user-agent")
    if is_crawler(ua):
        analytics_engine.track_event(
            db,
            "og_crawler_fetch",
            user_id=user.id,
            token=token,
            metadata={"campaign_id": campaign.id},
        )
        html = og_metadata.build_og_html(row, user, campaign)
        return HTMLResponse(content=html)

    analytics_engine.track_event(db, "preview_fetch", user_id=user.id, token=token)
    analytics_engine.track_event(
        db,
        "dlp_click_through",
        user_id=user.id,
        token=token,
        metadata={"campaign_id": campaign.id},
    )

    from app.config import get_settings

    settings = get_settings()
    watch_url = (
        f"{settings.frontend_base_url.rstrip('/')}/ad-watch"
        f"?token={token}&gate=email"
    )
    return RedirectResponse(watch_url)
