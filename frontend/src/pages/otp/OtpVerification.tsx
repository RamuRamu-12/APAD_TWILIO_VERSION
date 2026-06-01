import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import OtpInput from "../../components/otp/OtpInput";
import AdCard from "../../components/ads/AdCard";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { config } from "../../lib/config";
import { apiPublic } from "../../lib/api";
import { getFlow, clearFlow, saveFlow } from "../../lib/auth";
import { trackEvent } from "../../lib/analytics";
import type { AuthResponse, SendOtpResponse, Campaign } from "../../types/api";

const RESEND_COOLDOWN_SEC = 60;

export default function OtpVerification() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();
  const flow = getFlow();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [adsLoading, setAdsLoading] = useState(true);

  const loadAds = () => {
    setAdsLoading(true);
    apiPublic
      .get<Campaign[]>("/api/campaigns")
      .then((r) => setCampaigns(r.data.slice(0, 2)))
      .catch(() => setCampaigns([]))
      .finally(() => setAdsLoading(false));
  };

  useEffect(() => {
    loadAds();
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    const guard = async () => {
      if (!flow.mobile && !flow.token) {
        setError("Your session has expired. Please sign in again.");
        setChecking(false);
        return;
      }
      if (flow.otpForScreen) {
        setChecking(false);
        return;
      }
      try {
        const q = flow.token
          ? `token=${encodeURIComponent(flow.token)}`
          : `mobile=${encodeURIComponent(flow.mobile!)}`;
        const { data } = await apiPublic.get<{ otp_ad_completed: boolean }>(
          `/api/ad/status?${q}`
        );
        if (!data.otp_ad_completed) {
          navigate("/generate-otp", { replace: true });
          return;
        }
      } catch {
        setError("Unable to verify your session. Please sign in again.");
      }
      setChecking(false);
    };
    guard();
  }, []);

  const replayAds = () => {
    if (!flow.mobile && !flow.token) return;
    const q = flow.token
      ? `token=${encodeURIComponent(flow.token)}&gate=otp_request`
      : `mobile=${encodeURIComponent(flow.mobile!)}&gate=otp_request`;
    navigate(`/ad-watch?${q}`);
  };

  const resendOtp = useCallback(async () => {
    if (!flow.mobile || resendCooldown > 0 || resending) return;
    setResending(true);
    setError("");
    try {
      const { data } = await apiPublic.post<SendOtpResponse>("/api/otp/send-otp", {
        mobile: flow.mobile,
        token: flow.token,
      });
      saveFlow({
        maskedMobile: data.masked_mobile,
        otpForScreen: data.otp_for_screen ?? undefined,
      });
      setResendCooldown(RESEND_COOLDOWN_SEC);
      showToast("A new OTP has been sent.", false);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Could not resend code. Please try again.";
      setError(String(msg));
      showToast(String(msg), true);
    } finally {
      setResending(false);
    }
  }, [flow.mobile, flow.token, resendCooldown, resending, showToast]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!flow.mobile) {
      setError("Your session has expired. Please sign in again.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await apiPublic.post<AuthResponse>("/api/verify-otp", {
        mobile: flow.mobile,
        otp,
      });
      login(data.access_token, data.user);
      clearFlow();
      await trackEvent("portal_view", { userId: data.user.id });
      showToast("OTP verified successfully!", false);
      navigate(data.user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Invalid or expired code. Please try again.";
      setError(String(msg));
      showToast(String(msg), true);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div style={{ display: "flex", minHeight: "40vh", alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            width: "2.5rem",
            height: "2.5rem",
            border: "4px solid var(--glass-border)",
            borderTopColor: "var(--accent-cyan)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
      </div>
    );
  }

  if (error && !flow.mobile) {
    return (
      <div className="glass-panel" style={{ maxWidth: "520px", margin: "2rem auto" }}>
        <h1 className="form-title">Security Verification</h1>
        <p className="text-error" style={{ textAlign: "center" }}>{error}</p>
        <Link to="/login" className="text-link" style={{ display: "block", textAlign: "center", marginTop: "1rem" }}>
          Sign in
        </Link>
      </div>
    );
  }

  const contact = flow.maskedMobile || flow.mobile || "your number";

  return (
    <div className="verify-split-container animate-fade-in" style={{ width: "100%" }}>
      <div className="glass-panel" style={{ alignSelf: "start" }}>
        <button
          type="button"
          onClick={replayAds}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-secondary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
            marginBottom: "1.5rem",
            fontSize: "0.9rem",
            fontFamily: "inherit",
          }}
        >
          ← Replay Advertisements
        </button>

        <h1 className="form-title" style={{ fontSize: "1.75rem" }}>
          Security Verification
        </h1>
        <p className="form-subtitle">
          We have generated your verification code for <strong>{contact}</strong>
        </p>

        {config.pocMode && flow.otpForScreen ? (
          <div className="otp-callout">
            <div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                SMS delivery preview (staging only)
              </div>
            </div>
            <div className="otp-callout-code">{flow.otpForScreen}</div>
          </div>
        ) : (
          <p className="text-muted" style={{ fontSize: "0.9rem", marginBottom: "1.25rem", lineHeight: 1.5 }}>
            Enter the 6-digit code we sent to your mobile. The code expires after a few minutes.
          </p>
        )}

        <form onSubmit={submit}>
          <div className="form-group" style={{ alignItems: "center" }}>
            <label className="form-label">Enter 6-Digit OTP</label>
            <OtpInput value={otp} onChange={setOtp} />
          </div>
          {error && <p className="text-error" style={{ textAlign: "center", marginTop: "1rem" }}>{error}</p>}
          <button
            type="submit"
            className="submit-btn"
            disabled={loading || otp.length < 6}
            style={{ width: "100%", marginTop: "1.5rem" }}
          >
            {loading ? "Verifying..." : "Verify & Sign In"}
          </button>
        </form>

        <div style={{ marginTop: "2rem", textAlign: "center", fontSize: "0.9rem" }}>
          <span className="text-muted">Didn&apos;t receive the code? </span>
          <button
            type="button"
            onClick={resendOtp}
            disabled={resendCooldown > 0 || resending}
            style={{
              background: "none",
              border: "none",
              color: resendCooldown > 0 ? "var(--text-muted)" : "var(--accent-cyan)",
              cursor: resendCooldown > 0 ? "not-allowed" : "pointer",
              fontWeight: 600,
              fontFamily: "inherit",
            }}
          >
            {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Resend OTP"}
          </button>
        </div>
      </div>

      <div className="ads-section">
        <h2 className="ads-title-header">While you verify</h2>
        {adsLoading ? (
          <p className="text-muted" style={{ textAlign: "center", padding: "3rem" }}>
            Loading ads...
          </p>
        ) : campaigns.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: "center", padding: "3rem" }}>
            <p className="text-muted">No advertisements matched.</p>
          </div>
        ) : (
          <div className="ads-grid" style={{ gridTemplateColumns: "1fr", gap: "1.5rem" }}>
            {campaigns.map((c) => (
              <AdCard key={c.id} campaign={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
