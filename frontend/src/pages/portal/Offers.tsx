import { useEffect, useState } from "react";
import PageHeader from "../../components/ui/PageHeader";
import AdCard from "../../components/ads/AdCard";
import { api } from "../../lib/api";
import type { Campaign } from "../../types/api";
import { useAuth } from "../../hooks/useAuth";

export default function Offers() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    api.get<Campaign[]>("/api/campaigns").then((r) => setCampaigns(r.data));
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Your offers" description={`Curated for ${user?.name}`} />
      <div className="ads-grid">
        {campaigns.map((c) => (
          <AdCard key={c.id} campaign={c} />
        ))}
      </div>
    </div>
  );
}
