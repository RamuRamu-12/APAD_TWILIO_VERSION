import { useEffect, useMemo, useState } from "react";
import { useToast } from "../../context/ToastContext";
import { api } from "../../lib/api";
import type {
  CampaignProvenance,
  MerkleBatch,
  ProvenanceLineage,
  ProvenanceToken,
  ProvenanceVerifyResult,
} from "../../types/api";

function shortValue(value?: string | null, start = 18, end = 10) {
  if (!value) return "Not available";
  if (value.length <= start + end + 3) return value;
  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

function formatDate(value?: string | null) {
  if (!value) return "Not anchored";
  return new Date(value).toLocaleString();
}

export default function AdminBlockchainAudit() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<CampaignProvenance[]>([]);
  const [selectedToken, setSelectedToken] = useState<ProvenanceToken | null>(null);
  const [verifyResult, setVerifyResult] = useState<ProvenanceVerifyResult | null>(null);
  const [lineage, setLineage] = useState<ProvenanceToken[]>([]);
  const [batch, setBatch] = useState<MerkleBatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const stats = useMemo(() => {
    const tokenized = rows.filter((row) => row.provenance_token).length;
    return {
      campaigns: rows.length,
      tokenized,
      pending: Math.max(rows.length - tokenized, 0),
    };
  }, [rows]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<CampaignProvenance[]>("/api/provenance/campaigns");
      setRows(data);
      if (!selectedToken) {
        setSelectedToken(data.find((row) => row.provenance_token)?.provenance_token ?? null);
      }
    } catch {
      showToast("Could not load blockchain audit data", true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createProof = async (campaignId: number) => {
    setBusy(`create-${campaignId}`);
    try {
      const { data } = await api.post<ProvenanceToken>("/api/provenance/intake", {
        campaign_id: campaignId,
      });
      setSelectedToken(data);
      setVerifyResult(null);
      setLineage([]);
      showToast("Blockchain proof created for campaign");
      await load();
    } catch {
      showToast("Could not create blockchain proof", true);
    } finally {
      setBusy(null);
    }
  };

  const verify = async (token: ProvenanceToken) => {
    setBusy(`verify-${token.token_id}`);
    try {
      const { data } = await api.post<ProvenanceVerifyResult>(
        `/api/provenance/tokens/${token.token_id}/verify`,
        {}
      );
      setSelectedToken(token);
      setVerifyResult(data);
      showToast(data.valid ? "Ledger chain verified" : "Ledger verification failed", !data.valid);
    } catch {
      showToast("Could not verify provenance token", true);
    } finally {
      setBusy(null);
    }
  };

  const loadLineage = async (token: ProvenanceToken) => {
    setBusy(`lineage-${token.token_id}`);
    try {
      const { data } = await api.get<ProvenanceLineage>(
        `/api/provenance/tokens/${token.token_id}/lineage`
      );
      setSelectedToken(token);
      setLineage(data.lineage);
    } catch {
      showToast("Could not load lineage", true);
    } finally {
      setBusy(null);
    }
  };

  const finalizeBatch = async () => {
    setBusy("batch");
    try {
      const { data } = await api.post<MerkleBatch>("/api/provenance/batches/finalize");
      setBatch(data);
      showToast("Merkle batch finalized");
      await load();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      showToast(detail || "Could not finalize Merkle batch", true);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="admin-header">
        <div>
          <h1 style={{ fontSize: "1.75rem", marginBottom: "0.25rem" }}>Blockchain Audit</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Verify campaign creative provenance, ledger integrity, lineage, and Merkle roots.
          </p>
        </div>
        <button
          type="button"
          className="nav-btn active"
          disabled={busy === "batch"}
          onClick={finalizeBatch}
          style={{ padding: "0.7rem 1.4rem", borderRadius: "12px", color: "#000" }}
        >
          {busy === "batch" ? "Finalizing..." : "Finalize Merkle Batch"}
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        {[
          ["Campaigns", stats.campaigns],
          ["With APT proof", stats.tokenized],
          ["Pending proof", stats.pending],
        ].map(([label, value]) => (
          <div className="glass-panel" key={label} style={{ padding: "1.25rem" }}>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{label}</div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "#fff" }}>{value}</div>
          </div>
        ))}
      </div>

      {batch && (
        <div className="glass-panel" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.05rem", marginBottom: "0.75rem" }}>Latest Merkle Batch</h2>
          <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.8 }}>
            <div>Batch ID: {batch.batch_id}</div>
            <div>Merkle Root: {shortValue(batch.merkle_root, 28, 16)}</div>
            <div>Entries: {batch.entry_count}</div>
            <div>Anchor Status: {batch.anchor_status}</div>
          </div>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(320px, 1.3fr) minmax(300px, 0.9fr)",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        <div className="glass-panel" style={{ padding: "1.25rem" }}>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Campaign Provenance</h2>
          {loading ? (
            <p style={{ color: "var(--text-secondary)" }}>Loading blockchain audit data...</p>
          ) : rows.length === 0 ? (
            <p style={{ color: "var(--text-secondary)" }}>No campaigns found.</p>
          ) : (
            <div style={{ display: "grid", gap: "0.85rem" }}>
              {rows.map((row) => {
                const token = row.provenance_token;
                return (
                  <div
                    key={row.campaign_id}
                    style={{
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "14px",
                      padding: "1rem",
                      background: "rgba(255,255,255,0.04)",
                    }}
                  >
                    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                      <img
                        src={row.image_url}
                        alt=""
                        style={{
                          width: 70,
                          height: 54,
                          borderRadius: "10px",
                          objectFit: "cover",
                          background: "rgba(255,255,255,0.08)",
                        }}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 800, color: "#fff" }}>{row.campaign_name}</div>
                        <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                          Campaign #{row.campaign_id} · {shortValue(row.creative_url, 34, 10)}
                        </div>
                        <div style={{ marginTop: "0.35rem", fontSize: "0.8rem" }}>
                          Status:{" "}
                          <span style={{ color: token ? "#7CFFB2" : "#FFD166", fontWeight: 700 }}>
                            {token ? "APT proof available" : "Proof pending"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {token ? (
                      <div
                        style={{
                          display: "flex",
                          gap: "0.6rem",
                          flexWrap: "wrap",
                          marginTop: "0.9rem",
                        }}
                      >
                        <button className="nav-btn" type="button" onClick={() => setSelectedToken(token)}>
                          View Token
                        </button>
                        <button
                          className="nav-btn"
                          type="button"
                          disabled={busy === `verify-${token.token_id}`}
                          onClick={() => verify(token)}
                        >
                          Verify
                        </button>
                        <button
                          className="nav-btn"
                          type="button"
                          disabled={busy === `lineage-${token.token_id}`}
                          onClick={() => loadLineage(token)}
                        >
                          Lineage
                        </button>
                      </div>
                    ) : (
                      <button
                        className="nav-btn active"
                        type="button"
                        disabled={busy === `create-${row.campaign_id}`}
                        onClick={() => createProof(row.campaign_id)}
                        style={{ marginTop: "0.9rem", color: "#000" }}
                      >
                        {busy === `create-${row.campaign_id}` ? "Creating..." : "Create APT Proof"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: "grid", gap: "1rem" }}>
          <div className="glass-panel" style={{ padding: "1.25rem" }}>
            <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Selected Token</h2>
            {selectedToken ? (
              <div style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.9 }}>
                <div>Token ID: {selectedToken.token_id}</div>
                <div>Stage: {selectedToken.stage}</div>
                <div>Source: {selectedToken.source_id}</div>
                <div>Content Hash: {shortValue(selectedToken.content_hash, 24, 14)}</div>
                <div>Ledger Anchor: {shortValue(selectedToken.ledger_anchor, 24, 14)}</div>
                <div>Parent: {selectedToken.parent_token_id || "Intake token"}</div>
                <div>Created: {formatDate(selectedToken.created_at)}</div>
              </div>
            ) : (
              <p style={{ color: "var(--text-secondary)" }}>Select or create an APT proof.</p>
            )}
          </div>

          <div className="glass-panel" style={{ padding: "1.25rem" }}>
            <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Verification Result</h2>
            {verifyResult ? (
              <div style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.9 }}>
                <div>
                  Status:{" "}
                  <span style={{ color: verifyResult.valid ? "#7CFFB2" : "#FF8A8A", fontWeight: 800 }}>
                    {verifyResult.valid ? "Ledger chain valid" : "Verification failed"}
                  </span>
                </div>
                <div>Ledger Position: {verifyResult.ledger_position ?? "Unknown"}</div>
                {verifyResult.errors.length > 0 && (
                  <div>
                    Errors: {verifyResult.errors.join(", ")}
                  </div>
                )}
              </div>
            ) : (
              <p style={{ color: "var(--text-secondary)" }}>Run Verify to check ledger integrity.</p>
            )}
          </div>

          <div className="glass-panel" style={{ padding: "1.25rem" }}>
            <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Lineage</h2>
            {lineage.length > 0 ? (
              <div style={{ display: "grid", gap: "0.65rem" }}>
                {lineage.map((token, index) => (
                  <div
                    key={token.token_id}
                    style={{
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "12px",
                      padding: "0.75rem",
                      color: "var(--text-secondary)",
                      fontSize: "0.85rem",
                    }}
                  >
                    <strong style={{ color: "#fff" }}>Step {index + 1}</strong> · {token.stage}
                    <div>{token.token_id}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--text-secondary)" }}>Run Lineage to view parent-child chain.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
