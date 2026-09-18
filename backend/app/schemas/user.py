from pydantic import BaseModel, EmailStr, Field, field_validator

from app.utils.phone import normalize_mobile


class UserRegister(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    mobile: str = Field(min_length=8, max_length=20)
    email: EmailStr
    age: int = Field(ge=1, le=120)
    gender: str
    area: str
    marketing_opt_in: bool = False

    @field_validator("mobile")
    @classmethod
    def validate_mobile(cls, v: str) -> str:
        return normalize_mobile(v)


class UserLogin(BaseModel):
    mobile: str

    @field_validator("mobile")
    @classmethod
    def validate_mobile(cls, v: str) -> str:
        return normalize_mobile(v)


class AdminLoginRequest(BaseModel):
    mobile: str = Field(min_length=8, max_length=20)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("mobile")
    @classmethod
    def validate_mobile(cls, v: str) -> str:
        return normalize_mobile(v)


class UserResponse(BaseModel):
    id: int
    name: str
    mobile: str
    email: str
    age: int
    gender: str
    area: str
    role: str
    marketing_opt_in: bool = False

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    mobile: str = Field(min_length=8, max_length=20)
    email: EmailStr
    age: int = Field(ge=1, le=120)
    gender: str
    area: str
    marketing_opt_in: bool = False

    @field_validator("mobile")
    @classmethod
    def validate_mobile(cls, v: str) -> str:
        return normalize_mobile(v)


class MarketingOptInUpdate(BaseModel):
    marketing_opt_in: bool


class UnsubscribeRequest(BaseModel):
    token: str = Field(min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
