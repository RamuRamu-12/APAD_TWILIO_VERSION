from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.ad_completion import AdCompletion
from app.models.analytics_event import AnalyticsEvent
from app.models.generated_token import GeneratedToken
from app.models.otp_log import OtpLog
from app.models.user import User
from app.schemas.user import UserRegister, UserUpdate
from app.services.location_service import assert_active_location_for_user_area
from app.utils.security import hash_password, verify_password


def register_user(db: Session, data: UserRegister) -> User:
    email = data.email.strip().lower()
    if db.query(User).filter(User.mobile == data.mobile).first():
        raise HTTPException(status_code=400, detail="Mobile number already registered")
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    opted_in = bool(data.marketing_opt_in)
    area = assert_active_location_for_user_area(db, data.area)
    user = User(
        name=data.name,
        mobile=data.mobile,
        email=email,
        age=data.age,
        gender=data.gender,
        area=area,
        role="user",
        marketing_opt_in=opted_in,
        marketing_consent_updated_at=datetime.now(timezone.utc) if opted_in else None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_regular_user(db: Session, user_id: int) -> User:
    user = db.query(User).filter(User.id == user_id, User.role == "user").first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def update_user(db: Session, user_id: int, data: UserUpdate) -> User:
    user = get_regular_user(db, user_id)
    email = data.email.strip().lower()

    mobile_conflict = (
        db.query(User)
        .filter(User.mobile == data.mobile, User.id != user_id)
        .first()
    )
    if mobile_conflict:
        raise HTTPException(status_code=400, detail="Mobile number already registered")

    email_conflict = (
        db.query(User).filter(User.email == email, User.id != user_id).first()
    )
    if email_conflict:
        raise HTTPException(status_code=400, detail="Email already registered")

    opted_in = bool(data.marketing_opt_in)
    consent_changed = user.marketing_opt_in != opted_in

    area = assert_active_location_for_user_area(db, data.area)
    user.name = data.name
    user.mobile = data.mobile
    user.email = email
    user.age = data.age
    user.gender = data.gender
    user.area = area
    user.marketing_opt_in = opted_in
    if consent_changed:
        user.marketing_consent_updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user_id: int) -> None:
    user = get_regular_user(db, user_id)
    db.query(GeneratedToken).filter(GeneratedToken.user_id == user_id).delete(
        synchronize_session=False
    )
    db.query(OtpLog).filter(OtpLog.user_id == user_id).delete(synchronize_session=False)
    db.query(AdCompletion).filter(AdCompletion.user_id == user_id).delete(
        synchronize_session=False
    )
    db.query(AnalyticsEvent).filter(AnalyticsEvent.user_id == user_id).delete(
        synchronize_session=False
    )
    db.delete(user)
    db.commit()


def set_marketing_opt_in(db: Session, user: User, opted_in: bool) -> User:
    user.marketing_opt_in = opted_in
    user.marketing_consent_updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    return user


def login_lookup(db: Session, mobile: str) -> dict:
    user = db.query(User).filter(User.mobile == mobile).first()
    return {
        "exists": user is not None,
        "user_id": user.id if user else None,
        "name": user.name if user else None,
        "requires_admin_login": user is not None and user.role == "admin",
    }


def admin_login(db: Session, mobile: str, password: str) -> User:
    user = db.query(User).filter(User.mobile == mobile).first()
    if not user or user.role != "admin" or not user.password_hash:
        raise HTTPException(status_code=401, detail="Invalid mobile or password")
    if not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid mobile or password")
    return user


def create_admin_if_needed(db: Session, mobile: str, password: str) -> User:
    user = db.query(User).filter(User.mobile == mobile).first()
    if user:
        user.role = "admin"
        user.password_hash = hash_password(password)
        if not user.email:
            user.email = f"admin+{mobile}@apad.app"
        db.commit()
        db.refresh(user)
        return user

    admin_email = f"admin+{mobile}@apad.app"
    user = User(
        name="APAD Admin",
        mobile=mobile,
        email=admin_email,
        age=30,
        gender="any",
        area="HQ",
        role="admin",
        password_hash=hash_password(password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
