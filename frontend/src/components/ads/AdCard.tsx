import { useEffect, useRef, useState } from "react";
import type { Campaign } from "../../types/api";

interface AdCardProps {
  campaign: Campaign;
  personalizedTitle?: string;
  forcePlay?: boolean;
  onTimeUpdate?: (currentTime: number) => void;
}

function displayCategory(campaign: Campaign): string {
  const label = (campaign.title_template || campaign.name || "").trim();
  if (!label) return "Partner";
  const short = label.split(/[—–-]/)[0].trim();
  return short.length > 28 ? `${short.slice(0, 25)}…` : short;
}

export default function AdCard({
  campaign,
  personalizedTitle,
  forcePlay = false,
  onTimeUpdate,
}: AdCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [previewEnded, setPreviewEnded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const title = personalizedTitle || campaign.title_template || campaign.name;
  const videoUrl = campaign.creative_type === "video" ? campaign.creative_url : null;
  const categoryLabel = displayCategory(campaign);
  const isFeatured = campaign.priority >= 50;

  const handleMouseEnter = () => {
    if (!videoUrl || forcePlay) return;
    setIsHovered(true);
    setPreviewEnded(false);
    setVideoPlaying(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
    }, 50);
    timerRef.current = setTimeout(() => {
      if (videoRef.current) videoRef.current.pause();
      setVideoPlaying(false);
      setPreviewEnded(true);
    }, 5000);
  };

  const handleMouseLeave = () => {
    if (!videoUrl || forcePlay) return;
    setIsHovered(false);
    setVideoPlaying(false);
    setPreviewEnded(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const shouldShowVideo = forcePlay || (isHovered && !!videoUrl);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (shouldShowVideo && videoRef.current) {
      const el = videoRef.current;
      el.muted = true;
      const playPromise = el.play();
      if (playPromise) {
        playPromise
          .then(() => setIsPaused(false))
          .catch(() => setIsPaused(true));
      }
    }
  }, [shouldShowVideo]);

  return (
    <div className="ad-card" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <div className="ad-card-link" style={{ cursor: "default" }}>
        <div className="ad-image-container">
          <img
            src={campaign.image_url}
            alt={title}
            className="ad-image"
            style={{
              opacity: shouldShowVideo ? 0 : 1,
              transition: "opacity 0.25s ease",
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80";
            }}
          />
          {videoUrl && shouldShowVideo && (
            <video
              ref={videoRef}
              src={videoUrl}
              className="ad-video"
              muted
              playsInline
              autoPlay
              loop
              onPlay={() => setIsPaused(false)}
              onPause={() => setIsPaused(true)}
              onTimeUpdate={(e) => onTimeUpdate?.(e.currentTarget.currentTime)}
            />
          )}
          {forcePlay && isPaused && (
            <div className="replay-overlay" style={{ background: "rgba(0, 0, 0, 0.5)", zIndex: 6 }}>
              <span style={{ color: "var(--accent-cyan)", fontSize: "0.85rem", fontWeight: 600 }}>
                Tap to play
              </span>
            </div>
          )}
          {videoPlaying && !forcePlay && (
            <span className="preview-badge">
              <span className="preview-dot" />
              Preview
            </span>
          )}
          {videoPlaying && !forcePlay && (
            <div className="video-progress-track">
              <div className="video-progress-fill animating" />
            </div>
          )}
          {previewEnded && !forcePlay && (
            <div className="replay-overlay">
              <span>Hover to preview again</span>
            </div>
          )}
          <span className="ad-category-badge">{categoryLabel}</span>
          {isFeatured && !videoPlaying && !previewEnded && !forcePlay && (
            <span className="ad-priority-badge">Featured</span>
          )}
        </div>
        <div className="ad-content">
          <span className="ad-match-pill high">Personalized</span>
          <h3 className="ad-title">{title}</h3>
          <p className="ad-desc">{campaign.description}</p>
          {campaign.promo_suffix?.trim() && (
            <div className="ad-targeting-tags">
              <span className="tag tag-location">{campaign.promo_suffix}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
