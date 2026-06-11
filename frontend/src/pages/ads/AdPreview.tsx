import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { LinkButton } from "../../components/ui/Button";
import { apiPublic } from "../../lib/api";
import { saveFlow } from "../../lib/auth";
import { trackEvent } from "../../lib/analytics";
import type { AdWatchPayload } from "../../types/api";

export default function AdPreview() {
  const { token } = useParams<{ token: string }>();
  const [payload, setPayload] = useState<AdWatchPayload | null>(null);

  useEffect(() => {
    if (!token) return;
    saveFlow({ token });
    trackEvent("preview_fetch", { token });
    apiPublic
      .get<AdWatchPayload>(`/api/ad/watch?token=${encodeURIComponent(token)}&gate=email`)
      .then((r) => setPayload(r.data))
      .catch(() => setPayload(null));
  }, [token]);

  if (!token) return null;

  return (
    <div style={{ maxWidth: "32rem", margin: "0 auto" }} className="animate-fade-in">
      <div className="glass-panel">
        {payload ? (
          <>
            <span className="badge-brand">Partner offer</span>
            <h1 style={{ marginTop: "1rem", fontSize: "1.5rem" }}>{payload.personalized_title}</h1>
            <img
              src={payload.image_url}
              alt=""
              style={{ marginTop: "1.5rem", width: "100%", borderRadius: "12px", objectFit: "cover" }}
            />
            <p className="text-muted" style={{ marginTop: "1rem" }}>{payload.description}</p>
            <LinkButton
              to={`/ad-watch?token=${encodeURIComponent(token)}&gate=email`}
              fullWidth
              style={{ width: "100%", marginTop: "2rem" }}
            >
              View offer
            </LinkButton>
          </>
        ) : (
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <div
              style={{
                margin: "0 auto",
                width: "2.5rem",
                height: "2.5rem",
                border: "4px solid var(--glass-border)",
                borderTopColor: "var(--accent-cyan)",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
