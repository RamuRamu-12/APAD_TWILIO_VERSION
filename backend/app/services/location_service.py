from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.location import Location
from app.models.user import User

DEFAULT_LOCATION_NAMES = [
    "New York",
    "California",
    "London",
    "Tokyo",
    "Paris",
    "Hyderabad",
    "Mumbai",
    "Bangalore",
    "Delhi",
    "Chennai",
]


def seed_locations_if_empty(db: Session) -> None:
    if db.query(Location).first() is not None:
        return
    for name in DEFAULT_LOCATION_NAMES:
        db.add(Location(name=name, is_active=True))
    db.commit()


def list_active_locations(db: Session) -> list[Location]:
    return (
        db.query(Location)
        .filter(Location.is_active.is_(True))
        .order_by(Location.name)
        .all()
    )


def list_all_locations(db: Session) -> list[Location]:
    return db.query(Location).order_by(Location.name).all()


def find_active_location_by_name(db: Session, area: str) -> Location | None:
    key = (area or "").strip()
    if not key:
        return None
    return (
        db.query(Location)
        .filter(
            func.lower(Location.name) == key.lower(),
            Location.is_active.is_(True),
        )
        .first()
    )


def find_location_by_name(db: Session, area: str) -> Location | None:
    key = (area or "").strip()
    if not key:
        return None
    return (
        db.query(Location)
        .filter(func.lower(Location.name) == key.lower())
        .first()
    )


def resolve_canonical_area(db: Session, area: str) -> str:
    loc = find_active_location_by_name(db, area)
    if not loc:
        raise HTTPException(
            status_code=400,
            detail="Invalid or inactive location. Choose a location from the list.",
        )
    return loc.name


def assert_active_location_for_user_area(db: Session, area: str) -> str:
    return resolve_canonical_area(db, area)
