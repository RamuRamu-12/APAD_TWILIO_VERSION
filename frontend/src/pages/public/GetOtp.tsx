import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PhoneInput from "../../components/ui/PhoneInput";
import { IconPhone } from "../../components/ui/FormIcons";
import { useToast } from "../../context/ToastContext";
import { apiPublic } from "../../lib/api";
import { saveFlow } from "../../lib/auth";

export default function GetOtp() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await apiPublic.post("/api/login", { mobile });
      if (!data.exists) {
        const msg = "User not found. Register first.";
        setError(msg);
        showToast(msg, true);
        return;
      }
      saveFlow({ mobile });
      navigate(`/ad-watch?mobile=${encodeURIComponent(mobile)}&gate=login`);
    } catch {
      const msg = "Something went wrong.";
      setError(msg);
      showToast(msg, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ maxWidth: "520px", margin: "2rem auto" }}>
      <h1 className="form-title">Quick access</h1>
      <p className="form-subtitle">Enter your registered mobile number to continue.</p>
      <form onSubmit={submit}>
        <div className="form-group">
          <label className="form-label">Mobile</label>
          <div className="input-with-icon">
            <PhoneInput value={mobile} onChange={setMobile} required />
            <span className="input-icon-left" style={{ top: "50%", transform: "translateY(-50%)" }}>
              <IconPhone />
            </span>
          </div>
        </div>
        {error && <p className="text-error" style={{ marginBottom: "1rem" }}>{error}</p>}
        <button type="submit" className="submit-btn" disabled={loading} style={{ width: "100%" }}>
          {loading ? "Please wait…" : "Continue"}
        </button>
      </form>
      <p className="text-muted" style={{ marginTop: "1.5rem", textAlign: "center" }}>
        <Link to="/register" className="text-link">
          Create account
        </Link>
      </p>
    </div>
  );
}
