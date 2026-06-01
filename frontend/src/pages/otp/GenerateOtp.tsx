import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiPublic } from "../../lib/api";
import { getFlow } from "../../lib/auth";

export default function GenerateOtp() {
  const navigate = useNavigate();
  const flow = getFlow();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const check = async () => {
      if (!flow.mobile && !flow.token) {
        setError("Your session has expired. Please sign in again.");
        return;
      }
      try {
        const q = flow.token
          ? `token=${encodeURIComponent(flow.token)}`
          : `mobile=${encodeURIComponent(flow.mobile!)}`;
        const { data } = await apiPublic.get<{ login_ad_completed: boolean }>(
          `/api/ad/status?${q}`
        );
        if (!data.login_ad_completed) {
          setError("Please complete the sponsored message to continue.");
          return;
        }
        setReady(true);
      } catch {
        setError("Unable to continue. Please sign in again.");
      }
    };
    check();
  }, []);

  const continueFlow = () => {
    const q = flow.token
      ? `token=${encodeURIComponent(flow.token)}&gate=otp_request`
      : `mobile=${encodeURIComponent(flow.mobile!)}&gate=otp_request`;
    navigate(`/ad-watch?${q}`);
  };

  if (error) {
    return (
      <div className="glass-panel" style={{ maxWidth: "520px", margin: "2rem auto" }}>
        <h1 className="form-title">Mobile verification</h1>
        <p className="text-error" style={{ textAlign: "center" }}>{error}</p>
        <Link to="/login" className="text-link" style={{ display: "block", textAlign: "center", marginTop: "1rem" }}>
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="glass-panel animate-fade-in" style={{ maxWidth: "520px", margin: "2rem auto" }}>
      <h1 className="form-title">Mobile verification</h1>
      <p className="form-subtitle">
        Watch a brief sponsored message. We will then send a one-time password to your registered number.
      </p>
      <button type="button" className="submit-btn" disabled={!ready} onClick={continueFlow} style={{ width: "100%" }}>
        {ready ? "Continue" : "Please wait…"}
      </button>
    </div>
  );
}
