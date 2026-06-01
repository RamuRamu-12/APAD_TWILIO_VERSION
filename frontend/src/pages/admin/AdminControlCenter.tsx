import { FormEvent, useEffect, useMemo, useState } from "react";
import { useToast } from "../../context/ToastContext";
import { api } from "../../lib/api";
import type { AnalyticsRow, Campaign, User } from "../../types/api";

const PAGE_SIZE = 5;

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80";

const initialForm = {
  name: "",
  title_template: "",
  description: "",
  image_url: "",
  creative_url: "",
  creative_type: "video",
  min_watch_seconds: 5,
  promo_suffix: "",
  priority: 50,
  min_age: 18,
  max_age: 60,
  gender: "any",
  area: "any",
};

function ageBucket(age: number): string {
  if (age < 25) return "18-24";
  if (age < 35) return "25-34";
  if (age < 45) return "35-44";
  if (age < 55) return "45-54";
  return "55+";
}

function countMapToBars(map: Record<string, number>) {
  const max = Math.max(...Object.values(map), 1);
  return Object.entries(map).map(([label, count]) => ({
    label,
    count,
    pct: Math.round((count / max) * 100),
  }));
}

function eventBarClass(pct: number) {
  if (pct >= 70) return "ctr-high";
  if (pct >= 35) return "ctr-med";
  return "ctr-low";
}

export default function AdminControlCenter() {
  const { showToast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsRow[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [cRes, aRes, uRes] = await Promise.all([
        api.get<Campaign[]>("/api/campaigns"),
        api.get<AnalyticsRow[]>("/api/analytics"),
        api.get<User[]>("/api/users"),
      ]);
      setCampaigns(cRes.data);
      setAnalytics(aRes.data);
      setUsers(uRes.data);
    } catch {
      showToast("Could not load admin data", true);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (window.location.hash === "#analytics") {
      document.getElementById("analytics")?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const totalPages = Math.max(1, Math.ceil(campaigns.length / PAGE_SIZE));
  const pageCampaigns = campaigns.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const maxEventCount = Math.max(...analytics.map((r) => r.count), 1);

  const demographics = useMemo(() => {
    const byGender: Record<string, number> = {};
    const byLocation: Record<string, number> = {};
    const byAgeGroup: Record<string, number> = {};
    for (const u of users) {
      const g = u.gender || "Unknown";
      byGender[g] = (byGender[g] || 0) + 1;
      const loc = u.area?.trim() || "Unknown";
      byLocation[loc] = (byLocation[loc] || 0) + 1;
      const bucket = ageBucket(u.age);
      byAgeGroup[bucket] = (byAgeGroup[bucket] || 0) + 1;
    }
    return {
      byGender: countMapToBars(byGender),
      byLocation: countMapToBars(byLocation),
      byAgeGroup: countMapToBars(byAgeGroup),
    };
  }, [users]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const openCreate = () => {
    setForm({
      ...initialForm,
      name: "New Advertisement",
      title_template: "Special offer — limited time",
      description: "Exclusive deal. Book today and save.",
      image_url: "https://images.unsplash.com/photo-1537953773345-d172ccf13cf0?w=800",
      creative_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.title_template || !form.image_url || !form.creative_url) {
      showToast("Please fill in all required fields", true);
      return;
    }
    setSaving(true);
    try {
      await api.post("/api/campaigns/create", {
        name: form.name,
        title_template: form.title_template,
        description: form.description,
        image_url: form.image_url,
        creative_url: form.creative_url,
        creative_type: form.creative_type,
        min_watch_seconds: Number(form.min_watch_seconds),
        promo_suffix: form.promo_suffix,
        priority: Number(form.priority),
        targeting_rules: [
          {
            min_age: Number(form.min_age),
            max_age: Number(form.max_age),
            gender: form.gender,
            area: form.area || "any",
          },
        ],
      });
      showToast("Advertisement created successfully");
      setShowModal(false);
      await load();
      setPage(1);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Failed to create advertisement";
      showToast(String(msg), true);
    } finally {
      setSaving(false);
    }
  };

  const renderDemoBars = (
    items: { label: string; count: number; pct: number }[],
    emptyLabel: string,
    icon?: string
  ) => {
    if (items.length === 0) {
      return (
        <div style={{ fontSize: "0.9rem", color: "var(--text-muted)", textAlign: "center", padding: "1rem" }}>
          {emptyLabel}
        </div>
      );
    }
    return items.map((item) => (
      <div className="demo-bar-group" key={item.label} style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "0.3rem" }}>
          <span style={{ fontWeight: 600, color: "#fff" }}>
            {icon ? `${icon} ` : ""}
            {item.label}
          </span>
          <span style={{ color: "var(--text-secondary)" }}>{item.count} users</span>
        </div>
        <div className="chart-bar-track" style={{ height: "14px" }}>
          <div
            className={`chart-bar-fill ${item.pct >= 70 ? "high-ctr" : ""}`}
            style={{ width: `${Math.max(item.pct, 8)}%`, height: "100%" }}
          >
            <span className="chart-bar-value" style={{ fontSize: "0.65rem" }}>
              {item.count}
            </span>
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div className="animate-fade-in">
      <div className="admin-header">
        <div>
          <h1 style={{ fontSize: "1.75rem", marginBottom: "0.25rem" }}>Active Ads Registry</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Configure advertisements, audience rules, and review platform activity.
          </p>
        </div>
        <button
          type="button"
          className="nav-btn active"
          onClick={openCreate}
          style={{ padding: "0.7rem 1.4rem", borderRadius: "12px", color: "#000" }}
        >
          Add Advertisement
        </button>
      </div>

      <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Ad Title</th>
                <th>Format</th>
                <th>Target Info</th>
                <th>Priority</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pageCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
                    No advertisements registered. Click &quot;Add Advertisement&quot; to create one.
                  </td>
                </tr>
              ) : (
                pageCampaigns.map((c) => {
                  const rule = c.targeting_rules?.[0];
                  return (
                    <tr key={c.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <img
                            src={c.image_url}
                            alt=""
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 8,
                              objectFit: "cover",
                              border: "1px solid var(--glass-border)",
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                            }}
                          />
                          <div>
                            <span style={{ fontWeight: 600, display: "block" }}>{c.title_template}</span>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{c.name}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="tag" style={{ background: "rgba(255,255,255,0.08)" }}>
                          {c.creative_type}
                        </span>
                      </td>
                      <td>
                        {rule ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                            <span style={{ fontSize: "0.85rem" }}>{rule.area === "any" ? "All cities" : rule.area}</span>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                              {rule.min_age}-{rule.max_age} yrs | {rule.gender}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>—</span>
                        )}
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            color: c.priority > 0 ? "var(--accent-cyan)" : "var(--text-muted)",
                          }}
                        >
                          {c.priority}
                        </span>
                      </td>
                      <td>
                        <span className={`ad-match-pill ${c.is_active ? "high" : "med"}`}>
                          {c.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button
              type="button"
              className="page-btn"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
            >
              ←
            </button>
            <span className="page-info">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              className="page-btn"
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
            >
              →
            </button>
          </div>
        )}
      </div>

      <div className="analytics-section" id="analytics">
        <h2 className="ads-title-header">Platform activity</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          Sign-in, OTP, and campaign events tracked across the portal.
        </p>

        <div className="chart-container">
          {analytics.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
              No analytics data recorded yet.
            </div>
          ) : (
            analytics.map((item) => {
              const pct = Math.round((item.count / maxEventCount) * 100);
              const barWidth = Math.min(Math.max(pct, 8), 100);
              return (
                <div className="chart-bar-group" key={item.event_type}>
                  <div className="chart-bar-label-row">
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span className="chart-bar-title">{item.event_type}</span>
                      <span className={`ad-ctr-callout ${eventBarClass(pct)}`}>{item.count} events</span>
                    </div>
                  </div>
                  <div className="chart-bar-track">
                    <div
                      className={`chart-bar-fill ${pct >= 70 ? "high-ctr" : ""}`}
                      style={{ width: `${barWidth}%` }}
                    >
                      <span className="chart-bar-value">{item.count}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {users.length > 0 && (
        <div className="analytics-section" style={{ marginTop: "3rem" }}>
          <h2 className="ads-title-header">Audience insights</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
            Registered users grouped by city, gender, and age bracket.
          </p>

          <div className="demographics-grid">
            <div className="glass-panel" style={{ padding: "1.5rem" }}>
              <h3 style={{ fontSize: "1.15rem", marginBottom: "1rem", color: "var(--accent-cyan)" }}>Cities</h3>
              <div className="demographics-chart-list">
                {renderDemoBars(demographics.byLocation, "No location data", "📍")}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: "1.5rem" }}>
              <h3 style={{ fontSize: "1.15rem", marginBottom: "1rem", color: "var(--accent-cyan)" }}>Gender</h3>
              <div className="demographics-chart-list">
                {renderDemoBars(demographics.byGender, "No gender data", "🚻")}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: "1.5rem" }}>
              <h3 style={{ fontSize: "1.15rem", marginBottom: "1rem", color: "var(--accent-cyan)" }}>Age brackets</h3>
              <div className="demographics-chart-list">
                {renderDemoBars(demographics.byAgeGroup, "No age data", "🎂")}
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" role="presentation" onClick={() => setShowModal(false)}>
          <div
            className="glass-panel modal-content"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                marginBottom: "1.5rem",
                borderBottom: "1px solid var(--glass-border)",
                paddingBottom: "0.75rem",
              }}
            >
              Create Advertisement
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Internal name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Headline (shown on ad) *</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.title_template}
                  onChange={(e) => set("title_template", e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: 72 }}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Banner image URL *</label>
                <input
                  type="url"
                  className="form-input"
                  value={form.image_url}
                  onChange={(e) => set("image_url", e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Video / creative URL *</label>
                <input
                  type="url"
                  className="form-input"
                  value={form.creative_url}
                  onChange={(e) => set("creative_url", e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                <div className="form-group">
                  <label className="form-label">Min age</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.min_age}
                    onChange={(e) => set("min_age", Number(e.target.value))}
                    min={0}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Max age</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.max_age}
                    onChange={(e) => set("max_age", Number(e.target.value))}
                    min={0}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select
                    className="form-input form-select"
                    value={form.gender}
                    onChange={(e) => set("gender", e.target.value)}
                  >
                    <option value="any">Any</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">City (or &quot;any&quot;)</label>
                <input
                  className="form-input"
                  value={form.area}
                  onChange={(e) => set("area", e.target.value)}
                  placeholder="any"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.priority}
                    onChange={(e) => set("priority", Number(e.target.value))}
                    min={0}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Min watch (seconds)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.min_watch_seconds}
                    onChange={(e) => set("min_watch_seconds", Number(e.target.value))}
                    min={1}
                  />
                </div>
              </div>

              <div className="modal-footer-btns">
                <button
                  type="button"
                  className="nav-btn"
                  onClick={() => setShowModal(false)}
                  style={{ borderColor: "var(--accent-rose)" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="nav-btn active"
                  disabled={saving}
                  style={{ color: "#000", fontWeight: "bold" }}
                >
                  {saving ? "Creating…" : "Create Ad"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
