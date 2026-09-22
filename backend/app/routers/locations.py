from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_admin_user
from app.models.location import Location
from app.models.location_gate_video import LocationGateVideo
from app.models.user import User
from app.schemas.location import LocationCreate, LocationResponse, LocationUpdate
from app.services.location_service import list_active_locations, list_all_locations

router = APIRouter(tags=["locations"])


@router.get("/locations", response_model=list[LocationResponse])
def list_public_locations(db: Session = Depends(get_db)):
    return list_active_locations(db)


@router.get("/admin/locations", response_model=list[LocationResponse])
def list_admin_locations(
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    return list_all_locations(db)


@router.post("/admin/locations", response_model=LocationResponse)
def create_location(
    data: LocationCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    existing = (
        db.query(Location)
        .filter(func.lower(Location.name) == data.name.lower())
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Location already exists")
    row = Location(name=data.name, is_active=True)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.patch("/admin/locations/{location_id}", response_model=LocationResponse)
def update_location(
    location_id: int,
    data: LocationUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    row = db.query(Location).filter(Location.id == location_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Location not found")

    if data.name is not None and data.name.lower() != row.name.lower():
        conflict = (
            db.query(Location)
            .filter(
                func.lower(Location.name) == data.name.lower(),
                Location.id != location_id,
            )
            .first()
        )
        if conflict:
            raise HTTPException(status_code=400, detail="Location name already in use")
        old_name = row.name
        row.name = data.name
        gate = (
            db.query(LocationGateVideo)
            .filter(func.lower(LocationGateVideo.area) == old_name.lower())
            .first()
        )
        if gate:
            gate.area = data.name
        db.query(User).filter(func.lower(User.area) == old_name.lower()).update(
            {User.area: data.name}, synchronize_session=False
        )

    if data.is_active is not None:
        if data.is_active is False:
            user_count = (
                db.query(User)
                .filter(func.lower(User.area) == row.name.lower(), User.role == "user")
                .count()
            )
            if user_count > 0:
                raise HTTPException(
                    status_code=400,
                    detail="Cannot deactivate: users are registered in this location",
                )
        row.is_active = data.is_active

    db.commit()
    db.refresh(row)
    return row


@router.delete("/admin/locations/{location_id}")
def delete_location(
    location_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    row = db.query(Location).filter(Location.id == location_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Location not found")

    user_count = (
        db.query(User)
        .filter(func.lower(User.area) == row.name.lower(), User.role == "user")
        .count()
    )
    if user_count > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete: users are registered in this location",
        )

    db.query(LocationGateVideo).filter(
        func.lower(LocationGateVideo.area) == row.name.lower()
    ).delete(synchronize_session=False)
    db.delete(row)
    db.commit()
    return {"ok": True, "deleted_location_id": location_id}
