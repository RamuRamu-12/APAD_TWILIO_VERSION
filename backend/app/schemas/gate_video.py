from pydantic import BaseModel, field_validator

from app.schemas.location import LocationResponse
from app.utils.youtube import validate_youtube_url


class GateVideoCatalog(BaseModel):
    locations: list[LocationResponse]
    global_area_key: str


class GateVideoResponse(BaseModel):
    id: int
    area: str
    youtube_url: str
    title: str
    min_watch_seconds: int
    is_active: bool

    model_config = {"from_attributes": True}


class GateVideoUpsert(BaseModel):
    youtube_url: str
    title: str = "Sponsored message"
    min_watch_seconds: int = 5
    is_active: bool = True
    location_id: int | None = None

    @field_validator("youtube_url")
    @classmethod
    def check_youtube(cls, v: str) -> str:
        return validate_youtube_url(v)

    @field_validator("min_watch_seconds")
    @classmethod
    def check_min_watch(cls, v: int) -> int:
        if v < 1 or v > 600:
            raise ValueError("min_watch_seconds must be between 1 and 600")
        return v
