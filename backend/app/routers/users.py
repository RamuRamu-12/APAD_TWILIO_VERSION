from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_admin_user
from app.models.user import User
from app.schemas.user import UserRegister, UserResponse, UserUpdate
from app.services import analytics_engine, auth_engine
from app.services.user_search import search_users

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/search", response_model=list[UserResponse])
def search_users_endpoint(
    min_age: int | None = Query(None, ge=0),
    max_age: int | None = Query(None, ge=0),
    gender: str | None = Query(None),
    area: str | None = Query(None),
    q: str | None = Query(None),
    marketing_opt_in: bool | None = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    return search_users(
        db,
        min_age=min_age,
        max_age=max_age,
        gender=gender,
        area=area,
        q=q,
        marketing_opt_in=marketing_opt_in,
    )


@router.get("", response_model=list[UserResponse])
def list_users(db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    return db.query(User).filter(User.role == "user").order_by(User.id.desc()).all()


@router.post("", response_model=UserResponse)
def create_user(
    data: UserRegister,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    return auth_engine.register_user(db, data)


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    user = auth_engine.update_user(db, user_id, data)
    analytics_engine.track_event(
        db, "user_updated", user_id=user.id, metadata={"admin": True}
    )
    return user


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    auth_engine.delete_user(db, user_id)
    analytics_engine.track_event(
        db, "user_deleted", metadata={"deleted_user_id": user_id, "admin": True}
    )
    return {"ok": True, "deleted_user_id": user_id}
