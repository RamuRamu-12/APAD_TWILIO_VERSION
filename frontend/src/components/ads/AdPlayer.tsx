import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_FALLBACK_VIDEO, FALLBACK_AD_VIDEOS } from "../../lib/fallbackVideos";
import type { AdWatchPayload } from "../../types/api";

interface Props {
  payload: AdWatchPayload;
  onComplete: (watchDuration: number) => void;
  onProgress?: (seconds: number) => void;
}

export default function AdPlayer({ payload, onComplete, onProgress }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const doneRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const minSeconds = payload.min_watch_seconds;
  const isVideo = payload.creative_type === "video";

  const [seconds, setSeconds] = useState(0);
  const [done, setDone] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [srcIndex, setSrcIndex] = useState(0);
  const candidates = useMemo(() => {
    const primarySrc = payload.creative_url?.trim() || "";
    const isBlockedGoogle = primarySrc.includes("gtv-videos-bucket");
    return [
      ...(primarySrc && !isBlockedGoogle ? [primarySrc] : []),
      ...FALLBACK_AD_VIDEOS.filter((u) => u !== primarySrc),
    ];
  }, [payload.creative_url, payload.campaign_id]);
  const videoSrc = candidates[srcIndex] || DEFAULT_FALLBACK_VIDEO;

  const reportProgress = useCallback(
    (watched: number) => {
      setSeconds(watched);
      onProgress?.(watched);
    },
    [onProgress]
  );

  const tryComplete = useCallback(
    (watched: number) => {
      if (doneRef.current) return;
      const w = Math.floor(watched);
      reportProgress(watched);
      if (w < minSeconds) return;

      doneRef.current = true;
      setDone(true);
      onCompleteRef.current(w);
    },
    [minSeconds, reportProgress]
  );

  useEffect(() => {
    if (isVideo) return;
    const t = setInterval(() => {
      setSeconds((s) => {
        const next = s + 1;
        onProgress?.(next);
        tryComplete(next);
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [isVideo, tryComplete]);

  useEffect(() => {
    if (!isVideo) return;
    const tick = () => {
      const v = videoRef.current;
      if (!v || v.paused || doneRef.current) return;
      setSeconds(v.currentTime);
      tryComplete(v.currentTime);
    };
    const id = setInterval(tick, 400);
    return () => clearInterval(id);
  }, [isVideo, tryComplete]);

  useEffect(() => {
    if (!isVideo) return;
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    const playPromise = v.play();
    if (playPromise) {
      playPromise
        .then(() => setPlaying(true))
        .catch(() => {
          /* Browser blocked autoplay */
        });
    }
  }, [isVideo, videoSrc]);

  useEffect(() => {
    if (!isVideo) return;
    setVideoError(false);
    setPlaying(false);
    setSeconds(0);
    doneRef.current = false;
    setDone(false);
  }, [isVideo, videoSrc, payload.campaign_id, srcIndex]);

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    setSeconds(v.currentTime);
    tryComplete(v.currentTime);
  };

  const progress = Math.min(100, (seconds / minSeconds) * 100);
  const remaining = Math.max(0, minSeconds - Math.floor(seconds));

  return (
    <div style={{ overflow: "hidden" }}>
      <div
        style={{
          borderBottom: "1px solid var(--glass-border)",
          padding: "1rem 0",
          marginBottom: "1rem",
        }}
      >
        <span className="badge-brand">Sponsored message</span>
        <h3 style={{ marginTop: "0.5rem", fontSize: "1.1rem" }}>{payload.personalized_title}</h3>
        <p className="text-muted" style={{ marginTop: "0.25rem", fontSize: "0.85rem" }}>
          {payload.description}
        </p>
      </div>

      <div>
        {isVideo && !videoSrc ? (
          <p
            className="text-muted"
            style={{
              borderRadius: "12px",
              background: "rgba(0,0,0,0.3)",
              padding: "2rem",
              textAlign: "center",
              fontSize: "0.9rem",
            }}
          >
            This video is unavailable. Please try again later.
          </p>
        ) : isVideo ? (
          <>
            <video
              key={`${payload.campaign_id}-${videoSrc}`}
              ref={videoRef}
              src={videoSrc}
              poster={payload.image_url}
              style={{
                width: "100%",
                aspectRatio: "16/9",
                borderRadius: "12px",
                background: "#000",
                objectFit: "contain",
              }}
              controls
              playsInline
              preload="auto"
              onTimeUpdate={handleTimeUpdate}
              onLoadedData={() => setVideoError(false)}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => {
                const v = videoRef.current;
                tryComplete(v?.duration ?? minSeconds);
              }}
              onError={() => {
                if (srcIndex < candidates.length - 1) {
                  setSrcIndex((i) => i + 1);
                  return;
                }
                setVideoError(true);
              }}
            />
            {!playing && !done && !videoError && (
              <p className="text-muted" style={{ marginTop: "0.5rem", textAlign: "center", fontSize: "0.85rem" }}>
                Tap play and watch for at least {minSeconds} seconds
              </p>
            )}
            {videoError && (
              <p style={{ marginTop: "0.5rem", textAlign: "center", fontSize: "0.85rem", color: "var(--accent-rose)" }}>
                Video could not load.{" "}
                <button
                  type="button"
                  className="text-link"
                  style={{ background: "none", border: "none", cursor: "pointer", font: "inherit" }}
                  onClick={() => {
                    setVideoError(false);
                    setSrcIndex(0);
                  }}
                >
                  Retry
                </button>
              </p>
            )}
          </>
        ) : (
          <img
            src={payload.creative_url || payload.image_url}
            alt={payload.campaign_name}
            style={{ width: "100%", borderRadius: "12px", objectFit: "cover" }}
          />
        )}

        <div style={{ marginTop: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
            <span className="text-muted">Watch progress</span>
            <span style={{ color: "var(--accent-cyan)", fontWeight: 600 }}>
              {Math.floor(seconds)}s / {minSeconds}s required
              {!done && remaining > 0 && isVideo && playing && (
                <span className="text-muted"> · {remaining}s left</span>
              )}
            </span>
          </div>
          <div className="enforced-progress-track">
            <div
              className="enforced-progress-fill"
              style={{ width: `${done ? 100 : progress}%` }}
            />
          </div>
          {done && (
            <p style={{ marginTop: "0.75rem", textAlign: "center", fontSize: "0.9rem", color: "var(--accent-emerald)", fontWeight: 600 }}>
              Thank you. Redirecting…
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
