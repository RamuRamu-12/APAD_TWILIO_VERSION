import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import type { Campaign, SendCampaignEmailResponse } from "../../types/api";

interface SendCampaignModalProps {
  userIds: number[];
  onClose: () => void;
  onComplete: (result: SendCampaignEmailResponse) => void;
}

export default function SendCampaignModal({ userIds, onClose, onComplete }: SendCampaignModalProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    api
      .get<Campaign[]>("/api/campaigns")
      .then((r) => {
        const active = r.data.filter((c) => c.is_active);
        setCampaigns(active);
        if (active.length > 0) setSelectedId(active[0].id);
      })
      .catch(() => setError("Could not load campaigns"))
      .finally(() => setLoading(false));
  }, []);

  const send = async () => {
    if (!selectedId) return;
    setSending(true);
    setError("");
    try {
      const { data } = await api.post<SendCampaignEmailResponse>("/api/campaigns/send-email", {
        campaign_id: selectedId,
        user_ids: userIds,
      });
      onComplete(data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Failed to send campaign emails";
      setError(String(msg));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="glass-panel modal-content"
        style={{ maxWidth: "720px" }}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginBottom: "0.5rem" }}>Choose campaign to send</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
          Send to {userIds.length} user{userIds.length !== 1 ? "s" : ""} via email
        </p>

        {loading && <p className="text-muted">Loading campaigns…</p>}

        {!loading && campaigns.length === 0 && (
          <p className="text-muted">No active campaigns. Create one in Ads Registry first.</p>
        )}

        {!loading && campaigns.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "1rem",
              maxHeight: "360px",
              overflowY: "auto",
              marginBottom: "1.5rem",
            }}
          >
            {campaigns.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedId(c.id)}
                style={{
                  textAlign: "left",
                  padding: "1rem",
                  borderRadius: "12px",
                  border:
                    selectedId === c.id
                      ? "2px solid var(--accent-cyan)"
                      : "1px solid var(--glass-border)",
                  background: selectedId === c.id ? "rgba(0,242,254,0.08)" : "rgba(0,0,0,0.2)",
                  cursor: "pointer",
                  color: "inherit",
                }}
              >
                <img
                  src={c.image_url}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100px",
                    objectFit: "cover",
                    borderRadius: "8px",
                    marginBottom: "0.5rem",
                  }}
                />
                <p style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.25rem" }}>
                  {c.title_template}
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{c.name}</p>
              </button>
            ))}
          </div>
        )}

        {error && <p className="text-error" style={{ marginBottom: "1rem" }}>{error}</p>}

        <div className="modal-footer-btns">
          <button type="button" className="nav-btn" onClick={onClose} style={{ borderColor: "var(--accent-rose)" }}>
            Cancel
          </button>
          <button
            type="button"
            className="nav-btn active"
            disabled={!selectedId || sending || campaigns.length === 0}
            onClick={send}
            style={{ color: "#000", fontWeight: "bold" }}
          >
            {sending ? "Sending…" : `Send to ${userIds.length} via email`}
          </button>
        </div>
      </div>
    </div>
  );
}
