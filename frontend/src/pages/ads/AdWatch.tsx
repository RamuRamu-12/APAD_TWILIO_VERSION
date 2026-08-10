import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AdPlayer from "../../components/ads/AdPlayer";
import { apiPublic } from "../../lib/api";
import { getFlow, saveFlow } from "../../lib/auth";
import { trackEvent } from "../../lib/analytics";
import { config } from "../../lib/config";
import type { AdGate, AdWatchPayload, SendOtpResponse } from "../../types/api";

function parseGate(value: string | null): AdGate {
  if (value === "otp_request") return "otp_request";
  if (value === "email") return "email";
  return "login";
}

export default function AdWatch() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const flow = getFlow();
  const gate = parseGate(params.get("gate"));
  const token = params.get("token") || flow.token;
  const mobile = params.get("mobile") || flow.mobile;
  const isEmailCampaign = gate === "email";
  const [payload, setPayload] = useState<AdWatchPayload | null>(null);
  const [error, setError] = useState("");
  const [completing, setCompleting] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);

  useEffect(() => {
    if (token) saveFlow({ token });
  }, [token]);

  useEffect(() => {
    const parts: string[] = [];
    if (token) parts.push(`token=${encodeURIComponent(token)}`);
    else if (mobile) parts.push(`mobile=${encodeURIComponent(mobile)}`);
    else {
      setError("This offer link is invalid or has expired.");
      return;
    }
    parts.push(`gate=${gate}`);
    apiPublic
      .get<AdWatchPayload>(`/api/ad/watch?${parts.join("&")}`)
      .then((r) => {
        setPayload(r.data);
        saveFlow({ mobile: r.data.user_mobile, token: token || undefined });
      })
      .catch((err: unknown) => {
        const msg =
          (err as { response?: { data?: { detail?: string } } })?.response?.data
            ?.detail || "This offer is unavailable right now. Please try again.";
        setError(String(msg));
      });
  }, [token, mobile, gate]);

  const onComplete = async (watchDuration: number) => {
    if (completing) return;
    setCompleting(true);
    const resolvedMobile = mobile || payload?.user_mobile;
    try {
      await apiPublic.post("/api/ad/completed", {
        token: token || undefined,
        mobile: resolvedMobile,
        watch_duration: watchDuration,
        gate,
      });
      await trackEvent("ad_completed", {
        token: token || undefined,
        metadata: { gate },
      });

      if (gate === "email") {
        navigate("/ad-complete", { replace: true });
        return;
      }

      // login (and legacy otp_request): one ad → send OTP → verification
      const otpRes = await apiPublic.post<SendOtpResponse>("/api/otp/send-otp", {
        mobile: resolvedMobile,
        token: token || undefined,
      });
      saveFlow({
        mobile: resolvedMobile,
        token: token || undefined,
        otpForScreen: otpRes.data.otp_for_screen ?? undefined,
        maskedMobile: otpRes.data.masked_mobile,
      });
      navigate("/otp-verification");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Something went wrong. Please try again.";
      setError(String(msg));
      setCompleting(false);
    }
  };

  if (error) {
    return (
      <div className="glass-panel" style={{ maxWidth: "32rem", margin: "0 auto", textAlign: "center" }}>
        <p className="text-error">{error}</p>
      </div>
    );
  }

  if (!payload) {
    return (
      <div style={{ display: "flex", minHeight: "40vh", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div
            className="preview-dot"
            style={{
              width: 15,
              height: 15,
              margin: "0 auto 1rem",
              backgroundColor: "var(--accent-cyan)",
            }}
          />
          <p className="text-muted">Loading your offer…</p>
        </div>
      </div>
    );
  }

  const minSec = payload.min_watch_seconds;
  const secondsLeft = Math.max(minSec - Math.floor(playbackTime), 0);
  const progressPct = Math.min((playbackTime / minSec) * 100, 100);
  const backTo = "/login";
  const backLabel = "Back to sign in";

  return (
    <div className="mc-panel animate-fade-in" style={{ maxWidth: "600px", margin: "2rem auto" }}>
      {!isEmailCampaign && (
        <Link
          to={backTo}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-secondary)",
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
            marginBottom: "1.5rem",
            fontSize: "0.9rem",
            textDecoration: "none",
          }}
        >
          ← {backLabel}
        </Link>
      )}

      <div className="mc-brand-row" style={{ marginBottom: "1.25rem" }}>
        <span className="mc-circles" aria-hidden="true" />
        <span className="mc-brand-name">{config.appName}</span>
      </div>

      <div style={{ marginBottom: "2rem", borderBottom: "1px solid var(--glass-border)", paddingBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <span
            className="enforced-ad-status"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1rem", textTransform: "uppercase" }}
          >
            <span className="preview-dot" style={{ backgroundColor: "var(--mc-red)", width: 8, height: 8 }} />
            {isEmailCampaign ? "Your offer" : "Sponsored message"}
          </span>
          <span className="text-muted" style={{ fontSize: "0.95rem" }}>
            Continue in <strong style={{ color: "var(--text-primary)" }}>{secondsLeft}s</strong>
          </span>
        </div>
        <div className="enforced-progress-track">
          <div className="enforced-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <AdPlayer payload={payload} onComplete={onComplete} onProgress={setPlaybackTime} />
      {completing && (
        <p className="text-muted" style={{ marginTop: "1rem", textAlign: "center", fontSize: "0.9rem" }}>
          Sending your verification code…
        </p>
      )}
    </div>
  );
}
