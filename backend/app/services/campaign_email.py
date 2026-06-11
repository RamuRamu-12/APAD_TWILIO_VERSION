from sqlalchemy.orm import Session, joinedload

from app.models.campaign import Campaign
from app.models.user import User
from app.services import analytics_engine, email_provider, token_generator
from app.schemas.campaign_send import SendCampaignEmailResponse, SendCampaignEmailResult


def send_campaign_to_users(
    db: Session, campaign_id: int, user_ids: list[int]
) -> SendCampaignEmailResponse:
    from app.config import get_settings

    settings = get_settings()
    email_provider.ensure_email_configured()

    campaign = (
        db.query(Campaign)
        .options(joinedload(Campaign.targeting_rules))
        .filter(Campaign.id == campaign_id)
        .first()
    )
    if not campaign:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Campaign not found")
    if not campaign.is_active:
        from fastapi import HTTPException

        raise HTTPException(status_code=400, detail="Campaign is not active")

    users = db.query(User).filter(User.id.in_(user_ids), User.role == "user").all()
    found_ids = {u.id for u in users}

    results: list[SendCampaignEmailResult] = []
    sent = skipped = failed = 0

    for uid in user_ids:
        if uid not in found_ids:
            results.append(
                SendCampaignEmailResult(
                    user_id=uid, status="failed", message="User not found"
                )
            )
            failed += 1
            continue

    for user in users:
        email = (user.email or "").strip()
        if not email or "@" not in email:
            results.append(
                SendCampaignEmailResult(
                    user_id=user.id,
                    email=email or None,
                    status="skipped",
                    message="No valid email address",
                )
            )
            skipped += 1
            continue

        links = token_generator.generate_tokens_for_campaign(
            db, campaign_id, user_ids=[user.id], match_audience=False
        )
        if not links:
            results.append(
                SendCampaignEmailResult(
                    user_id=user.id,
                    email=email,
                    status="failed",
                    message="Could not generate link",
                )
            )
            failed += 1
            continue

        token = links[0]["token"]
        preview_url = f"{settings.backend_base_url.rstrip('/')}/preview/{token}"

        subject, html, text = email_provider.build_campaign_email(
            user_name=user.name,
            title_template=campaign.title_template,
            description=campaign.description,
            image_url=campaign.image_url,
            preview_url=preview_url,
            app_name=settings.app_name,
        )

        send_result = email_provider.send_campaign_email(email, subject, html, text)
        if send_result.ok:
            analytics_engine.track_event(
                db,
                "campaign_email_sent",
                user_id=user.id,
                token=token,
                metadata={"campaign_id": campaign_id},
            )
            results.append(
                SendCampaignEmailResult(
                    user_id=user.id,
                    email=email,
                    status="sent",
                    url=preview_url,
                )
            )
            sent += 1
        else:
            results.append(
                SendCampaignEmailResult(
                    user_id=user.id,
                    email=email,
                    status="failed",
                    url=preview_url,
                    message=send_result.error or "Send failed",
                )
            )
            failed += 1

    return SendCampaignEmailResponse(
        sent=sent, skipped=skipped, failed=failed, results=results
    )
