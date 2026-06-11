from dataclasses import dataclass

from botocore.exceptions import BotoCoreError, ClientError
from fastapi import HTTPException

from app.config import get_settings
from app.services.og_metadata import personalize


@dataclass
class EmailSendResult:
    ok: bool
    error: str | None = None


def _escape_html(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def _ses_source(from_email: str, from_name: str) -> str:
    if from_name:
        return f"{from_name} <{from_email}>"
    return from_email


def build_campaign_email(
    *,
    user_name: str,
    title_template: str,
    description: str,
    image_url: str,
    preview_url: str,
    app_name: str,
) -> tuple[str, str, str]:
    title = personalize(title_template, user_name)
    body = personalize(description, user_name)
    safe_title = _escape_html(title)
    safe_body = _escape_html(body)
    safe_name = _escape_html(user_name)
    safe_url = _escape_html(preview_url)
    safe_image = _escape_html(image_url)

    subject = f"{title} — exclusive offer for you"

    text = f"""Hi {user_name},

{title}

{body}

View your offer: {preview_url}

— {app_name}
"""

    html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:24px auto;background:#ffffff;border-radius:12px;overflow:hidden;">
    <tr>
      <td style="padding:32px 28px 16px;">
        <p style="margin:0 0 8px;color:#6b7280;font-size:14px;">Hi {safe_name},</p>
        <h1 style="margin:0 0 12px;font-size:22px;color:#111827;line-height:1.3;">{safe_title}</h1>
        <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.5;">{safe_body}</p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 28px;">
        <img src="{safe_image}" alt="{safe_title}" width="544" style="width:100%;max-width:544px;height:auto;border-radius:8px;display:block;" />
      </td>
    </tr>
    <tr>
      <td style="padding:28px 28px 32px;text-align:center;">
        <a href="{preview_url}" style="display:inline-block;background:linear-gradient(135deg,#00f2fe,#3b82f6);color:#000000;font-weight:700;font-size:16px;text-decoration:none;padding:14px 32px;border-radius:10px;">
          View your offer
        </a>
        <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;line-height:1.5;">
          If the button does not work, copy this link into your browser:<br />
          <a href="{preview_url}" style="color:#3b82f6;word-break:break-all;">{safe_url}</a>
        </p>
        <p style="margin:16px 0 0;font-size:11px;color:#9ca3af;">{app_name}</p>
      </td>
    </tr>
  </table>
</body>
</html>"""

    return subject, html, text


def send_campaign_email(to: str, subject: str, html: str, text: str) -> EmailSendResult:
    settings = get_settings()
    if not settings.email_enabled:
        return EmailSendResult(ok=True)

    if not settings.ses_from_email:
        return EmailSendResult(ok=False, error="Amazon SES is not configured (SES_FROM_EMAIL)")

    try:
        import boto3
    except ImportError:
        return EmailSendResult(ok=False, error="boto3 package not installed")

    source = _ses_source(settings.ses_from_email, settings.ses_from_name)
    client_kwargs: dict = {"region_name": settings.aws_region}
    access_key = settings.aws_access_key_id.strip()
    secret_key = settings.aws_secret_access_key.strip()
    if access_key and secret_key:
        client_kwargs["aws_access_key_id"] = access_key
        client_kwargs["aws_secret_access_key"] = secret_key
    try:
        client = boto3.client("ses", **client_kwargs)
        client.send_email(
            Source=source,
            Destination={"ToAddresses": [to]},
            Message={
                "Subject": {"Data": subject, "Charset": "UTF-8"},
                "Body": {
                    "Text": {"Data": text, "Charset": "UTF-8"},
                    "Html": {"Data": html, "Charset": "UTF-8"},
                },
            },
        )
        return EmailSendResult(ok=True)
    except ClientError as exc:
        message = exc.response.get("Error", {}).get("Message", str(exc))
        return EmailSendResult(ok=False, error=message)
    except BotoCoreError as exc:
        return EmailSendResult(ok=False, error=str(exc))
    except Exception as exc:
        return EmailSendResult(ok=False, error=str(exc))


def ensure_email_configured() -> None:
    settings = get_settings()
    if not settings.email_enabled:
        return
    if not settings.ses_from_email:
        raise HTTPException(
            status_code=503,
            detail="Email is enabled but Amazon SES is not configured (SES_FROM_EMAIL)",
        )
    if not settings.aws_access_key_id.strip() or not settings.aws_secret_access_key.strip():
        raise HTTPException(
            status_code=503,
            detail=(
                "Email is enabled but AWS credentials are missing "
                "(AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)"
            ),
        )
