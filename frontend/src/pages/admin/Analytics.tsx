import { useEffect, useState } from "react";
import PageHeader from "../../components/ui/PageHeader";
import { api } from "../../lib/api";
import type { AnalyticsRow } from "../../types/api";

export default function Analytics() {
  const [rows, setRows] = useState<AnalyticsRow[]>([]);
  const maxCount = Math.max(...rows.map((r) => r.count), 1);

  useEffect(() => {
    api.get<AnalyticsRow[]>("/api/analytics").then((r) => setRows(r.data));
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Analytics" description="Login and ad funnel stats." />

      {rows.length > 0 && (
        <div className="chart-container analytics-section">
          {rows.map((r) => {
            const pct = Math.round((r.count / maxCount) * 100);
            const high = pct >= 70;
            return (
              <div key={r.event_type} className="chart-bar-group">
                <div className="chart-bar-label-row">
                  <span className="chart-bar-title">{r.event_type}</span>
                  <span className="chart-bar-stats">{r.count} events</span>
                </div>
                <div className="chart-bar-track">
                  <div
                    className={`chart-bar-fill ${high ? "high-ctr" : ""}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="ads-grid" style={{ marginTop: "2rem" }}>
        {rows.map((r) => (
          <div key={r.event_type} className="glass-panel" style={{ textAlign: "center", padding: "1.5rem" }}>
            <p className="hero-gradient-text" style={{ fontSize: "2.5rem", fontWeight: 800 }}>
              {r.count}
            </p>
            <p className="text-muted" style={{ marginTop: "0.5rem", fontSize: "0.9rem", fontWeight: 500 }}>
              {r.event_type}
            </p>
          </div>
        ))}
      </div>

      {rows.length === 0 && (
        <p className="text-muted" style={{ marginTop: "2rem", textAlign: "center" }}>
          No events yet — run a user flow first.
        </p>
      )}
    </div>
  );
}
