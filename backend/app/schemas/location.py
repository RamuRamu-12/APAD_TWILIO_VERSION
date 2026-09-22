from pydantic import BaseModel, field_validator


class LocationResponse(BaseModel):
    id: int
    name: str
    is_active: bool

    model_config = {"from_attributes": True}


class LocationCreate(BaseModel):
    name: str

    @field_validator("name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        name = v.strip()
        if not name:
            raise ValueError("Location name is required")
        if len(name) > 120:
            raise ValueError("Location name is too long")
        return name


class LocationUpdate(BaseModel):
    name: str | None = None
    is_active: bool | None = None

    @field_validator("name")
    @classmethod
    def strip_name(cls, v: str | None) -> str | None:
        if v is None:
            return None
        name = v.strip()
        if not name:
            raise ValueError("Location name cannot be empty")
        if len(name) > 120:
            raise ValueError("Location name is too long")
        return name
