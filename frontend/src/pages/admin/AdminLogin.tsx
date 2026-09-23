import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { apiPublic } from "../../lib/api";
import { config } from "../../lib/config";
import type { AuthResponse } from "../../types/api";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [mobile, setMobile] = useState("1111111111");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await apiPublic.post<AuthResponse>("/api/auth/admin-login", {
        mobile,
        password,
      });
      login(data.access_token, data.user);
      navigate("/admin", { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Invalid mobile or password";
      setError(String(msg));
      showToast(String(msg), true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ maxWidth: "520px", margin: "2rem auto" }}>
      <h1
        className="form-title"
        style={{
          background: "var(--gradient-neon)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Administrator sign-in
      </h1>
      <p className="form-subtitle">Authorized staff access for {config.appName}</p>
      <form onSubmit={submit}>
        <div className="form-group">
          <label className="form-label">Mobile</label>
          <input
            type="tel"
            className="form-input"
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 11))}
            placeholder="1111111111"
            inputMode="numeric"
            autoComplete="tel"
            required
          />
          <p className="text-muted" style={{ fontSize: "0.8rem", marginTop: "0.35rem" }}>
            Demo admin mobile: 1111111111
          </p>
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-error" style={{ marginBottom: "1rem" }}>{error}</p>}
        <button type="submit" className="submit-btn" disabled={loading} style={{ width: "100%" }}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="text-muted" style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.9rem" }}>
        End user?{" "}
        <Link to="/login" className="text-link">
          Consumer sign-in
        </Link>
      </p>
    </div>
  );
}
