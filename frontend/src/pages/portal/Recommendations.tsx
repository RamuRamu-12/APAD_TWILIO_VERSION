import { useEffect, useState } from "react";
import PageHeader from "../../components/ui/PageHeader";
import { api } from "../../lib/api";
import type { CampaignRecommendation } from "../../types/api";

export default function Recommendations() {
  const [items, setItems] = useState<CampaignRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<CampaignRecommendation[]>("/api/campaigns/for-me")
      .then((r) => setItems(r.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Recommended for you" />
      {loading && <p className="text-muted">Loading…</p>}
      {!loading && items.length === 0 && (
        <p className="text-muted">No matching offers right now.</p>
      )}
      <ul style={{ display: "flex", flexDirection: "column", gap: "1rem", listStyle: "none", padding: 0 }}>
        {items.map((item) => (
          <li key={item.id} className="glass-panel" style={{ padding: "1.25rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontWeight: 600 }}>{item.personalized_title}</span>
              <p className="text-muted" style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>{item.name}</p>
            </div>
            <span className="ad-match-pill high">For you</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
