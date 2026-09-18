from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import MarketingOptInUpdate, UnsubscribeRequest, UserResponse
from app.services import analytics_engine, auth_engine
from app.utils.unsubscribe import decode_unsubscribe_token

router = APIRouter(tags=["marketing"])


@router.patch("/me/marketing-opt-in", response_model=UserResponse)
def update_my_marketing_opt_in(
    data: MarketingOptInUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    user = auth_engine.set_marketing_opt_in(db, user, data.marketing_opt_in)
    analytics_engine.track_event(
        db,
        "marketing_opted_in" if user.marketing_opt_in else "marketing_opted_out",
        user_id=user.id,
    )
    return user


@router.post("/marketing/unsubscribe")
def unsubscribe_from_campaign_emails(
    data: UnsubscribeRequest,
    db: Session = Depends(get_db),
):
    user_id = decode_unsubscribe_token(data.token)
    if user_id is None:
        raise HTTPException(status_code=400, detail="Invalid or expired unsubscribe link")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid unsubscribe link")
    if user.marketing_opt_in:
        auth_engine.set_marketing_opt_in(db, user, False)
        analytics_engine.track_event(db, "marketing_opted_out", user_id=user.id)
    return {
        "ok": True,
        "message": "You have been unsubscribed from campaign emails.",
    }
