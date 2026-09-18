import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiPublic } from "../../lib/api";
import { config } from "../../lib/config";

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState<"working" | "ok" | "error">("working");
  const [message, setMessage] = useState("Unsubscribing you from campaign emails…");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("This unsubscribe link is missing or invalid.");
      return;
    }
    apiPublic
      .post("/api/marketing/unsubscribe", { token })
      .then((r) => {
        setStatus("ok");
        setMessage(r.data?.message || "You have been unsubscribed from campaign emails.");
      })
      .catch((err: unknown) => {
        const detail =
          (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
          "Could not unsubscribe. The link may be invalid or expired.";
        setStatus("error");
        setMessage(String(detail));
      });
  }, [token]);

  return (
    <div
      className="glass-panel animate-fade-in"
      style={{ maxWidth: "480px", margin: "3rem auto", textAlign: "center" }}
    >
      <h1 className="form-title" style={{ marginBottom: "0.75rem" }}>
        {config.appName}
      </h1>
      <h2 style={{ fontSize: "1.15rem", marginBottom: "0.75rem" }}>
        {status === "ok" ? "Unsubscribed" : status === "error" ? "Unsubscribe failed" : "Please wait"}
      </h2>
      <p className="text-muted" style={{ fontSize: "0.95rem", lineHeight: 1.5 }}>
        {message}
      </p>
      <div style={{ marginTop: "1.5rem" }}>
        <Link to="/login" className="nav-btn">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
