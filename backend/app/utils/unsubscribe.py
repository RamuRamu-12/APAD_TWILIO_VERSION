from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

from app.config import get_settings

UNSUBSCRIBE_PURPOSE = "unsub"
UNSUBSCRIBE_TTL_DAYS = 365 * 5


def create_unsubscribe_token(user_id: int) -> str:
    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(days=UNSUBSCRIBE_TTL_DAYS)
    payload = {"sub": str(user_id), "purpose": UNSUBSCRIBE_PURPOSE, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_unsubscribe_token(token: str) -> int | None:
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError:
        return None
    if payload.get("purpose") != UNSUBSCRIBE_PURPOSE:
        return None
    try:
        return int(payload["sub"])
    except (KeyError, TypeError, ValueError):
        return None
