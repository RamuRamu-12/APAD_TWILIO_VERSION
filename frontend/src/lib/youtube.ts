export function extractYoutubeVideoId(url: string): string | null {
  const raw = (url || "").trim();
  if (!raw) return null;
  if (/^[\w-]{11}$/.test(raw)) return raw;

  try {
    const parsed = new URL(raw.includes("://") ? raw : `https://${raw}`);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id && id.length === 11 ? id : null;
    }
    if (host.includes("youtube.com")) {
      if (parsed.pathname.startsWith("/embed/")) {
        const id = parsed.pathname.split("/")[2];
        return id && id.length === 11 ? id : null;
      }
      const v = parsed.searchParams.get("v");
      return v && v.length === 11 ? v : null;
    }
  } catch {
    return null;
  }
  return null;
}

export function isYoutubeCreative(creativeType: string, creativeUrl: string): boolean {
  if (creativeType === "youtube") return true;
  return !!extractYoutubeVideoId(creativeUrl);
}

export function youtubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1`;
}

export function youtubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}
