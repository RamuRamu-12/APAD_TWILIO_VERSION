import { useCallback, useEffect, useId, useRef, useState } from "react";
import { extractYoutubeVideoId, youtubeEmbedUrl } from "../../lib/youtube";

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        options: {
          videoId: string;
          playerVars?: Record<string, string | number>;
          events?: {
            onReady?: (event: { target: InstanceType<NonNullable<typeof window.YT>["Player"]> }) => void;
            onStateChange?: (event: { data: number }) => void;
          };
        }
      ) => {
        getCurrentTime: () => number;
        getDuration: () => number;
        getPlayerState: () => number;
        playVideo: () => void;
        destroy: () => void;
      };
      PlayerState: { UNSTARTED: number; PLAYING: number; PAUSED: number; ENDED: number; CUED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytApiPromise: Promise<void> | null = null;

function loadYoutubeIframeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    if (document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const poll = setInterval(() => {
        if (window.YT?.Player) {
          clearInterval(poll);
          resolve();
        }
      }, 100);
      return;
    }
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return ytApiPromise;
}

type Props = {
  youtubeUrl: string;
  minSeconds: number;
  title: string;
  poster?: string;
  onComplete: (watchDuration: number) => void;
  onProgress?: (seconds: number) => void;
};

export default function YoutubeGatePlayer({
  youtubeUrl,
  minSeconds,
  title,
  poster,
  onComplete,
  onProgress,
}: Props) {
  const reactId = useId().replace(/:/g, "");
  const containerId = `yt-player-${reactId}`;
  const playerRef = useRef<InstanceType<NonNullable<typeof window.YT>["Player"]> | null>(
    null
  );
  const doneRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const videoId = extractYoutubeVideoId(youtubeUrl);
  const [seconds, setSeconds] = useState(0);
  const [done, setDone] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [needsTapToPlay, setNeedsTapToPlay] = useState(false);

  const tryComplete = useCallback(
    (watched: number) => {
      if (doneRef.current) return;
      const w = Math.floor(watched);
      setSeconds(watched);
      onProgress?.(watched);
      if (w < minSeconds) return;
      doneRef.current = true;
      setDone(true);
      onCompleteRef.current(w);
    },
    [minSeconds, onProgress]
  );

  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    loadYoutubeIframeApi()
      .then(() => {
        if (cancelled || !window.YT?.Player) return;
        playerRef.current?.destroy?.();
        playerRef.current = new window.YT.Player(containerId, {
          videoId,
          playerVars: {
            autoplay: 1,
            mute: 1,
            playsinline: 1,
            controls: 1,
            rel: 0,
            modestbranding: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event) => {
              event.target.playVideo();
              window.setTimeout(() => {
                const state = event.target.getPlayerState?.();
                const playing = state === window.YT!.PlayerState.PLAYING;
                const buffering = state === 3;
                if (!playing && !buffering) setNeedsTapToPlay(true);
              }, 2000);
            },
            onStateChange: (event) => {
              if (event.data === window.YT!.PlayerState.PLAYING) {
                setNeedsTapToPlay(false);
              }
              if (event.data === window.YT!.PlayerState.ENDED) {
                const dur = playerRef.current?.getDuration() ?? minSeconds;
                tryComplete(dur);
              }
            },
          },
        });
        intervalId = setInterval(() => {
          const t = playerRef.current?.getCurrentTime?.() ?? 0;
          if (t > 0) tryComplete(t);
        }, 500);
      })
      .catch(() => setApiError(true));

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, [videoId, containerId, minSeconds, tryComplete]);

  const progress = Math.min(100, (seconds / minSeconds) * 100);
  const remaining = Math.max(0, minSeconds - Math.floor(seconds));

  if (!videoId) {
    return (
      <p className="text-muted" style={{ textAlign: "center", padding: "1.5rem" }}>
        Invalid YouTube URL configured for this location.
      </p>
    );
  }

  if (apiError) {
    return (
      <div>
        <iframe
          title={title}
          src={youtubeEmbedUrl(videoId)}
          style={{
            width: "100%",
            aspectRatio: "16/9",
            border: 0,
            borderRadius: "12px",
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        <p className="text-muted" style={{ marginTop: "0.75rem", fontSize: "0.85rem" }}>
          Watch the video, then tap continue when the progress bar is full (
          {minSeconds}s required).
        </p>
        <FallbackTimer minSeconds={minSeconds} onComplete={onComplete} onProgress={onProgress} />
      </div>
    );
  }

  const startPlayback = () => {
    playerRef.current?.playVideo();
    setNeedsTapToPlay(false);
  };

  return (
    <div>
      <div style={{ position: "relative", width: "100%" }}>
        <div
          id={containerId}
          style={{
            width: "100%",
            aspectRatio: "16/9",
            borderRadius: "12px",
            overflow: "hidden",
            background: `#000 url(${poster || ""}) center/cover`,
          }}
        />
        {needsTapToPlay && !done && (
          <button
            type="button"
            onClick={startPlayback}
            aria-label="Start video"
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              borderRadius: "12px",
              background: "rgba(0,0,0,0.45)",
              cursor: "pointer",
              color: "#fff",
              fontSize: "1rem",
              fontWeight: 600,
            }}
          >
            Tap to play
          </button>
        )}
      </div>
      <p className="text-muted" style={{ marginTop: "0.5rem", textAlign: "center", fontSize: "0.85rem" }}>
        Video starts automatically (muted). Use player controls for sound. Watch at least {minSeconds}s
        {!done && remaining > 0 ? ` (${remaining}s left)` : ""}
      </p>
      <div style={{ marginTop: "1rem" }}>
        <div className="enforced-progress-track">
          <div className="enforced-progress-fill" style={{ width: `${done ? 100 : progress}%` }} />
        </div>
        {done && (
          <p style={{ marginTop: "0.75rem", textAlign: "center", color: "var(--accent-emerald)", fontWeight: 600 }}>
            Thank you. Redirecting…
          </p>
        )}
      </div>
    </div>
  );
}

function FallbackTimer({
  minSeconds,
  onComplete,
  onProgress,
}: {
  minSeconds: number;
  onComplete: (n: number) => void;
  onProgress?: (n: number) => void;
}) {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSeconds((s) => {
        const next = s + 1;
        onProgress?.(next);
        if (next >= minSeconds) onComplete(minSeconds);
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, minSeconds, onComplete, onProgress]);

  return (
    <button
      type="button"
      className="btn-primary"
      style={{ marginTop: "1rem", width: "100%" }}
      onClick={() => setRunning(true)}
      disabled={running && seconds < minSeconds}
    >
      {running ? `Watching… ${seconds}/${minSeconds}s` : "Start watch timer"}
    </button>
  );
}
