from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.user import User


def search_users(
    db: Session,
    *,
    min_age: int | None = None,
    max_age: int | None = None,
    gender: str | None = None,
    area: str | None = None,
    q: str | None = None,
) -> list[User]:
    query = db.query(User).filter(User.role == "user")

    if min_age is not None:
        query = query.filter(User.age >= min_age)
    if max_age is not None:
        query = query.filter(User.age <= max_age)
    if gender and gender.lower() != "any":
        query = query.filter(User.gender.ilike(gender))
    if area and area.strip():
        needle = f"%{area.strip()}%"
        query = query.filter(User.area.ilike(needle))
    if q and q.strip():
        needle = f"%{q.strip()}%"
        query = query.filter(
            or_(
                User.name.ilike(needle),
                User.email.ilike(needle),
                User.mobile.ilike(needle),
            )
        )

    return query.order_by(User.id.desc()).all()
