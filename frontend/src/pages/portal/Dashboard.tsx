import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdCard from "../../components/ads/AdCard";
import { api } from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../context/ToastContext";
import { trackEvent } from "../../lib/analytics";
import { getInterests } from "../../lib/uiPrefs";
import type { Campaign, User } from "../../types/api";

export default function Dashboard() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [adsLoading, setAdsLoading] = useState(true);
  const [optInSaving, setOptInSaving] = useState(false);
  const interests = getInterests();

  const fetchAds = useCallback(() => {
    setAdsLoading(true);
    api
      .get<Campaign[]>("/api/campaigns")
      .then((r) => setCampaigns(r.data))
      .catch(() => setCampaigns([]))
      .finally(() => setAdsLoading(false));
  }, []);

  const toggleMarketingOptIn = async (checked: boolean) => {
    setOptInSaving(true);
    try {
      const { data } = await api.patch<User>("/api/me/marketing-opt-in", {
        marketing_opt_in: checked,
      });
      updateUser(data);
      showToast(
        checked
          ? "You will receive campaign emails."
          : "You will no longer receive campaign emails."
      );
    } catch {
      showToast("Could not update email preference", true);
    } finally {
      setOptInSaving(false);
    }
  };

  useEffect(() => {
    trackEvent("portal_view", { userId: user?.id });
    fetchAds();
  }, [user?.id, fetchAds]);

  return (
    <div className="animate-fade-in">
      <header className="header-nav">
        <div className="logo">APAD Portal</div>
      </header>

      <div className="dashboard-grid">
        <div className="glass-panel user-profile-panel" style={{ height: "fit-content" }}>
          <div className="profile-avatar">{user?.name.charAt(0).toUpperCase()}</div>
          <h2 style={{ textAlign: "center", marginBottom: "1rem", fontSize: "1.5rem" }}>{user?.name}</h2>

          <div className="profile-field">
            <span className="profile-field-label">Location</span>
            <span className="profile-field-val">{user?.area}</span>
          </div>
          <div className="profile-field">
            <span className="profile-field-label">Age</span>
            <span className="profile-field-val">{user?.age} years</span>
          </div>
          <div className="profile-field">
            <span className="profile-field-label">Gender</span>
            <span className="profile-field-val" style={{ textTransform: "capitalize" }}>{user?.gender}</span>
          </div>

          <div
            className="profile-field"
            style={{ flexDirection: "column", gap: "0.4rem", alignItems: "flex-start" }}
          >
            <span className="profile-field-label">Interests & Preferences</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
              {interests.length > 0 ? (
                interests.map((pref) => (
                  <span key={pref} className="tag tag-interest">
                    {pref}
                  </span>
                ))
              ) : (
                <span className="text-muted" style={{ fontSize: "0.8rem" }}>
                  None selected
                </span>
              )}
            </div>
          </div>

          <div className="profile-field" style={{ borderBottom: "none" }}>
            <span className="profile-field-label">Contact</span>
            <span className="profile-field-val" style={{ fontSize: "0.85rem" }}>{user?.mobile}</span>
          </div>

          <label
            className="profile-field"
            style={{
              borderBottom: "none",
              cursor: "pointer",
              alignItems: "flex-start",
              gap: "0.75rem",
              marginTop: "0.5rem",
            }}
          >
            <input
              type="checkbox"
              checked={!!user?.marketing_opt_in}
              disabled={optInSaving}
              onChange={(e) => toggleMarketingOptIn(e.target.checked)}
              style={{ marginTop: "0.2rem", width: "1.05rem", height: "1.05rem", flexShrink: 0 }}
            />
            <span>
              <span className="profile-field-label" style={{ display: "block" }}>
                Campaign emails
              </span>
              <span className="text-muted" style={{ fontSize: "0.8rem", lineHeight: 1.4 }}>
                {user?.marketing_opt_in
                  ? "You are opted in. Uncheck to stop campaign emails."
                  : "Opt in to receive personalized campaign emails."}
              </span>
            </span>
          </label>
        </div>

        <div className="ads-section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 className="ads-title-header" style={{ marginBottom: 0 }}>
              Personalized offers
            </h2>
            <button
              type="button"
              onClick={fetchAds}
              style={{
                background: "none",
                border: "none",
                color: "var(--accent-cyan)",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: 600,
                fontFamily: "inherit",
              }}
            >
              🔄 Refresh Offers
            </button>
          </div>
          <p className="text-muted" style={{ fontSize: "0.95rem", marginBottom: "1rem" }}>
            Welcome back. Here are offers selected for your profile.
          </p>

          {adsLoading ? (
            <p className="text-muted" style={{ textAlign: "center", padding: "4rem" }}>
              Loading secure advertisements...
            </p>
          ) : campaigns.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: "center", padding: "4rem" }}>
              <p className="text-muted">No offers are available for you right now. Check back soon.</p>
            </div>
          ) : (
            <div className="ads-grid">
              {campaigns.map((c) => (
                <AdCard key={c.id} campaign={c} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: "2rem", display: "flex", flexWrap: "wrap", gap: "1rem" }}>
        {[
          { to: "/offers", label: "All offers" },
          { to: "/recommendations", label: "Recommendations" },
          { to: "/profile", label: "Profile" },
        ].map((item) => (
          <Link key={item.to} to={item.to} className="nav-btn">
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
