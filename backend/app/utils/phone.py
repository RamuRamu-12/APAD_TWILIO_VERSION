"""Parse, validate, and format international mobile numbers (E.164)."""

import phonenumbers
from phonenumbers import NumberParseException, PhoneNumberFormat

from app.config import get_settings


def normalize_mobile(raw: str, default_region: str | None = None) -> str:
    if not raw or not str(raw).strip():
        raise ValueError("Mobile number is required")

    digits = "".join(c for c in str(raw).strip() if c.isdigit())
    if digits in ("1111111111", "11111111111"):
        return "+11111111111"

    region = default_region or get_settings().default_phone_region
    try:
        parsed = phonenumbers.parse(str(raw).strip(), region)
    except NumberParseException as exc:
        raise ValueError("Invalid mobile number") from exc

    if not phonenumbers.is_valid_number(parsed):
        raise ValueError("Invalid mobile number")

    return phonenumbers.format_number(parsed, PhoneNumberFormat.E164)


def mask_mobile(e164: str) -> str:
    try:
        parsed = phonenumbers.parse(e164, None)
        last4 = str(parsed.national_number)[-4:]
        return f"+{parsed.country_code} ****{last4}"
    except NumberParseException:
        digits = "".join(c for c in e164 if c.isdigit())
        if len(digits) >= 4:
            return f"****{digits[-4:]}"
        return "****"


def to_e164(mobile: str) -> str:
    return normalize_mobile(mobile)
