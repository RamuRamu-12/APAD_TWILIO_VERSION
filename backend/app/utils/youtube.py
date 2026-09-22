import re
from urllib.parse import parse_qs, urlparse

_YOUTUBE_HOSTS = frozenset(
    {"youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtu.be"}
)


def extract_youtube_video_id(url: str) -> str | None:
    raw = (url or "").strip()
    if not raw:
        return None
    if re.fullmatch(r"[\w-]{11}", raw):
        return raw
    parsed = urlparse(raw if "://" in raw else f"https://{raw}")
    host = (parsed.netloc or "").lower().removeprefix("www.")
    if host == "youtu.be":
        vid = parsed.path.strip("/").split("/")[0]
        return vid if len(vid) == 11 else None
    if "youtube" in host:
        if parsed.path.startswith("/embed/"):
            vid = parsed.path.split("/")[2] if len(parsed.path.split("/")) > 2 else ""
            return vid if len(vid) == 11 else None
        qs = parse_qs(parsed.query)
        vid = (qs.get("v") or [None])[0]
        return vid if vid and len(vid) == 11 else None
    return None


def is_youtube_url(url: str) -> bool:
    return extract_youtube_video_id(url) is not None


def validate_youtube_url(url: str) -> str:
    vid = extract_youtube_video_id(url)
    if not vid:
        raise ValueError("URL must be a valid YouTube link (youtube.com or youtu.be)")
    return url.strip()


def youtube_thumbnail_url(video_id: str) -> str:
    return f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"
