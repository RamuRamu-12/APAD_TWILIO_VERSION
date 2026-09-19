import asyncio
import logging
from dataclasses import dataclass

from twilio.base.exceptions import TwilioRestException
from twilio.rest import Client

from app.config import get_settings
from app.utils.phone import to_e164

logger = logging.getLogger(__name__)


@dataclass
class SendResult:
    delivered: bool
    channel: str
    preview_text: str | None = None


def build_sms_preview(mobile: str, otp: str, promo_line: str | None) -> str:
    suffix = f" {promo_line}" if promo_line else ""
    digits = "".join(c for c in mobile if c.isdigit())
    tail = digits[-4:] if len(digits) >= 4 else mobile
    return f"APAD: Your OTP is {otp} for ***{tail}.{suffix}"


def render_otp_sms_template(template: str, otp: str) -> str:
    if "{otp}" not in template:
        raise ValueError("OTP_SMS_TEMPLATE must include the {otp} placeholder")
    return template.replace("{otp}", otp)


class MockProvider:
    """POC: logs OTP; code is generated and verified in the database."""

    external_otp = False

    async def send_otp(self, mobile: str, otp: str, promo_line: str | None) -> SendResult:
        preview = build_sms_preview(mobile, otp, promo_line)
        logger.info("POC mock SMS -> %s | OTP %s", mobile, otp)
        return SendResult(delivered=False, channel="mock", preview_text=preview)

    def check_otp(self, mobile: str, code: str) -> bool:
        return False


class TwilioMessagingProvider:
    """Production: exact OTP SMS body via Programmable Messaging (10DLC / approved template)."""

    external_otp = False

    def __init__(self) -> None:
        settings = get_settings()
        if not (settings.twilio_account_sid and settings.twilio_auth_token):
            raise RuntimeError(
                "Twilio Messaging requires TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN"
            )
        if not (
            settings.twilio_messaging_service_sid.strip()
            or settings.twilio_from_number.strip()
        ):
            raise RuntimeError(
                "Twilio Messaging requires TWILIO_MESSAGING_SERVICE_SID or TWILIO_FROM_NUMBER"
            )
        if not settings.otp_sms_template.strip():
            raise RuntimeError("OTP_SMS_TEMPLATE is required for twilio_messaging")

        self._client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
        self._messaging_service_sid = settings.twilio_messaging_service_sid.strip()
        self._from_number = settings.twilio_from_number.strip()
        self._template = settings.otp_sms_template.strip()

    async def send_otp(self, mobile: str, otp: str, promo_line: str | None) -> SendResult:
        del promo_line  # OTP SMS uses approved template only — no campaign promo
        body = render_otp_sms_template(self._template, otp)
        await asyncio.to_thread(self._send_sync, mobile, body)
        return SendResult(delivered=True, channel="twilio_messaging", preview_text=body)

    def _send_sync(self, mobile: str, body: str) -> None:
        e164 = to_e164(mobile)
        create_kwargs: dict = {"to": e164, "body": body}
        if self._messaging_service_sid:
            create_kwargs["messaging_service_sid"] = self._messaging_service_sid
        else:
            create_kwargs["from_"] = to_e164(self._from_number)
        self._client.messages.create(**create_kwargs)
        logger.info("Twilio Messaging OTP sent (ends %s)", e164[-4:])

    def check_otp(self, mobile: str, code: str) -> bool:
        return False


class TwilioVerifyProvider:
    """Legacy: Twilio Verify sends and validates the OTP (fixed Verify SMS wording)."""

    external_otp = True

    def __init__(self) -> None:
        settings = get_settings()
        if not (
            settings.twilio_account_sid
            and settings.twilio_auth_token
            and settings.twilio_verify_service_sid
        ):
            raise RuntimeError(
                "Twilio Verify requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, "
                "and TWILIO_VERIFY_SERVICE_SID"
            )
        self._client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
        self._service_sid = settings.twilio_verify_service_sid
        self._channel = settings.twilio_otp_channel

    async def send_otp(self, mobile: str, otp: str, promo_line: str | None) -> SendResult:
        del otp, promo_line
        await asyncio.to_thread(self._send_sync, mobile)
        return SendResult(delivered=True, channel="twilio_verify")

    def _send_sync(self, mobile: str) -> None:
        e164 = to_e164(mobile)
        self._client.verify.v2.services(self._service_sid).verifications.create(
            to=e164,
            channel=self._channel,
        )
        logger.info("Twilio Verify OTP sent (ends %s)", e164[-4:])

    def check_otp(self, mobile: str, code: str) -> bool:
        e164 = to_e164(mobile)
        try:
            result = (
                self._client.verify.v2.services(self._service_sid)
                .verification_checks.create(to=e164, code=code)
            )
            return result.status == "approved"
        except TwilioRestException as exc:
            if exc.status == 404:
                return False
            raise


def get_sms_provider() -> MockProvider | TwilioMessagingProvider | TwilioVerifyProvider:
    settings = get_settings()
    mode = settings.sms_provider.lower()
    if mode == "twilio_messaging":
        return TwilioMessagingProvider()
    if mode in ("twilio", "twilio_verify"):
        return TwilioVerifyProvider()
    return MockProvider()
