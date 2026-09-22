from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_admin_user
from app.models.location_gate_video import GLOBAL_GATE_VIDEO_AREA, LocationGateVideo
from app.models.user import User
from app.schemas.gate_video import GateVideoCatalog, GateVideoResponse, GateVideoUpsert
from app.schemas.location import LocationResponse
from app.services.location_service import (
    find_active_location_by_name,
    list_active_locations,
    resolve_canonical_area,
)

router = APIRouter(prefix="/admin/gate-videos", tags=["admin-gate-videos"])


@router.get("", response_model=list[GateVideoResponse])
def list_gate_videos(
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    rows = db.query(LocationGateVideo).order_by(LocationGateVideo.area).all()
    return rows


@router.get("/catalog", response_model=GateVideoCatalog)
def gate_video_catalog(
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    locations = list_active_locations(db)
    return GateVideoCatalog(
        locations=[LocationResponse.model_validate(loc) for loc in locations],
        global_area_key=GLOBAL_GATE_VIDEO_AREA,
    )


@router.put("/{area}", response_model=GateVideoResponse)
def upsert_gate_video(
    area: str,
    data: GateVideoUpsert,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    key = area.strip()
    if not key:
        raise HTTPException(status_code=400, detail="Area is required")

    if data.location_id is not None and key != GLOBAL_GATE_VIDEO_AREA:
        loc = find_active_location_by_name(db, key)
        if not loc or loc.id != data.location_id:
            raise HTTPException(status_code=400, detail="Location does not match URL")

    if key == GLOBAL_GATE_VIDEO_AREA:
        canonical = GLOBAL_GATE_VIDEO_AREA
    else:
        canonical = resolve_canonical_area(db, key)

    row = db.query(LocationGateVideo).filter(LocationGateVideo.area == canonical).first()
    if row is None:
        row = LocationGateVideo(area=canonical)
        db.add(row)

    row.youtube_url = data.youtube_url.strip()
    row.title = data.title.strip() or "Sponsored message"
    row.min_watch_seconds = data.min_watch_seconds
    row.is_active = data.is_active
    db.commit()
    db.refresh(row)
    return row
