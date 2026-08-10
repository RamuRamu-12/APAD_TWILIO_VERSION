import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PhoneInput from "../../components/ui/PhoneInput";
import { IconPhone, IconCheck } from "../../components/ui/FormIcons";
import { useToast } from "../../context/ToastContext";
import { apiPublic } from "../../lib/api";
import { saveFlow } from "../../lib/auth";
import { config } from "../../lib/config";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const preset = (location.state as { mobile?: string })?.mobile || "";
  const [mobile, setMobile] = useState(preset);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isMobileValid = mobile.trim().length >= 8;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await apiPublic.post<{
        exists: boolean;
        requires_admin_login?: boolean;
      }>("/api/login", { mobile });
      if (!data.exists) {
        const msg = "Mobile not registered. Please create an account first.";
        setError(msg);
        showToast(msg, true);
        return;
      }
      if (data.requires_admin_login) {
        const msg = "This number is for admin. Use Admin login instead.";
        setError(msg);
        showToast(msg, true);
        return;
      }
      saveFlow({ mobile });
      navigate(`/ad-watch?mobile=${encodeURIComponent(mobile)}&gate=login`);
    } catch {
      const msg = "Could not verify your number. Try again.";
      setError(msg);
      showToast(msg, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mc-panel animate-fade-in" style={{ maxWidth: "520px", margin: "2rem auto" }}>
      <div className="mc-brand-row" style={{ justifyContent: "center", marginBottom: "1.25rem" }}>
        <span className="mc-circles" aria-hidden="true" />
        <span className="mc-brand-name">{config.appName}</span>
      </div>
      <h1 className="form-title">Sign in</h1>
      <p className="form-subtitle">
        Enter your registered mobile number to continue to your bank dashboard.
      </p>

      <form onSubmit={submit}>
        <div className="form-group">
          <label className="form-label">Mobile number</label>
          <div className="input-with-icon">
            <PhoneInput value={mobile} onChange={setMobile} required />
            <span className="input-icon-left" style={{ top: "50%", transform: "translateY(-50%)" }}>
              <IconPhone />
            </span>
            {isMobileValid && (
              <span className="input-icon-right-validation">
                <IconCheck />
              </span>
            )}
          </div>
        </div>
        {error && <p className="text-error" style={{ marginBottom: "1rem" }}>{error}</p>}
        <button type="submit" className="submit-btn mc-btn" disabled={loading} style={{ width: "100%" }}>
          {loading ? "Please wait…" : "Continue"}
        </button>
      </form>

      <p className="text-muted" style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.9rem" }}>
        New here?{" "}
        <Link to="/register" className="text-link">
          Create account
        </Link>
      </p>
      <p style={{ marginTop: "1rem", textAlign: "center", borderTop: "1px solid var(--glass-border)", paddingTop: "1rem" }}>
        <Link to="/admin/login" className="text-link" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
          Go to Admin Console
        </Link>
      </p>
    </div>
  );
}
