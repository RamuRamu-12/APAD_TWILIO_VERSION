import { FormEvent, useEffect, useState } from "react";
import { Button } from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import FormField from "../../components/ui/FormField";
import PageHeader from "../../components/ui/PageHeader";
import { api } from "../../lib/api";
import type { Campaign } from "../../types/api";

const initialForm = {
  name: "New Advertisement",
  title_template: "Special offer — limited time",
  description: "Exclusive deal. Book today and save.",
  image_url: "https://images.unsplash.com/photo-1537953773345-d172ccf13cf0?w=800",
  creative_url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  creative_type: "video",
  min_watch_seconds: 5,
  promo_suffix: "Limited time offer — claim now",
  priority: 50,
  min_age: 18,
  max_age: 60,
  gender: "any",
  area: "any",
};

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = () => api.get<Campaign[]>("/api/campaigns").then((r) => setCampaigns(r.data));

  useEffect(() => {
    load();
  }, []);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
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
            area: form.area,
          },
        ],
      });
      await load();
      setForm(initialForm);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Could not create advertisement";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Advertisements"
        description="Create ads with fixed copy. Users are matched by age, gender, and city only."
      />

      <Card title="New advertisement" className="mb-8">
        <form onSubmit={create} style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <p className="form-label" style={{ gridColumn: "1 / -1" }}>Ad content</p>

          <FormField label="Advertisement name" required style={{ gridColumn: "1 / -1" }}>
            <input
              className="form-input"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
            />
          </FormField>

          <FormField label="Headline (shown on the ad)" required style={{ gridColumn: "1 / -1" }}>
            <input
              className="form-input"
              placeholder="e.g. 30% off Bali getaways"
              value={form.title_template}
              onChange={(e) => set("title_template", e.target.value)}
              required
            />
          </FormField>

          <FormField label="Description" required style={{ gridColumn: "1 / -1" }}>
            <textarea
              className="form-input"
              style={{ minHeight: "72px" }}
              placeholder="Offer details shown under the video"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              required
            />
          </FormField>

          <FormField label="SMS line (optional)" style={{ gridColumn: "1 / -1" }}>
            <input
              className="form-input"
              placeholder="Short text sent with OTP"
              value={form.promo_suffix}
              onChange={(e) => set("promo_suffix", e.target.value)}
            />
          </FormField>

          <FormField label="Preview image URL" required style={{ gridColumn: "1 / -1" }}>
            <input
              type="url"
              className="form-input"
              value={form.image_url}
              onChange={(e) => set("image_url", e.target.value)}
              required
            />
          </FormField>

          <FormField label="Video URL" required style={{ gridColumn: "1 / -1" }}>
            <input
              type="url"
              className="form-input"
              value={form.creative_url}
              onChange={(e) => set("creative_url", e.target.value)}
              required
            />
          </FormField>

          <FormField label="Media format">
            <select
              className="form-input form-select"
              value={form.creative_type}
              onChange={(e) => set("creative_type", e.target.value)}
            >
              <option value="video">Video</option>
              <option value="image">Image</option>
            </select>
          </FormField>

          <FormField label="Min watch (seconds)" required>
            <input
              type="number"
              min={1}
              max={120}
              className="form-input"
              value={form.min_watch_seconds}
              onChange={(e) => set("min_watch_seconds", Number(e.target.value))}
              required
            />
          </FormField>

          <FormField label="Ranking (when multiple campaigns match)">
            <input
              type="number"
              min={0}
              max={100}
              className="form-input"
              value={form.priority}
              onChange={(e) => set("priority", Number(e.target.value))}
            />
          </FormField>

          <p className="form-label" style={{ gridColumn: "1 / -1", borderTop: "1px solid var(--glass-border)", paddingTop: "1rem", marginTop: "0.5rem" }}>
            Audience matching
          </p>
          <p className="text-muted" style={{ gridColumn: "1 / -1", fontSize: "0.8rem", marginTop: "-0.5rem" }}>
            Uses the user&apos;s profile from registration (age, gender, city). Leave city blank or
            &quot;any&quot; for all cities.
          </p>

          <FormField label="Min age">
            <input
              type="number"
              min={0}
              max={120}
              className="form-input"
              value={form.min_age}
              onChange={(e) => set("min_age", Number(e.target.value))}
            />
          </FormField>

          <FormField label="Max age">
            <input
              type="number"
              min={0}
              max={120}
              className="form-input"
              value={form.max_age}
              onChange={(e) => set("max_age", Number(e.target.value))}
            />
          </FormField>

          <FormField label="Gender">
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
          </FormField>

          <FormField label="City">
            <input
              className="form-input"
              placeholder="any"
              value={form.area}
              onChange={(e) => set("area", e.target.value)}
            />
          </FormField>

          {error && <p className="text-error" style={{ gridColumn: "1 / -1" }}>{error}</p>}

          <div style={{ gridColumn: "1 / -1" }}>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create advertisement"}
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Active advertisements">
        {campaigns.length === 0 ? (
          <p className="text-muted">No advertisements yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Headline</th>
                  <th>Ranking</th>
                  <th>Min. view (s)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>{c.title_template}</td>
                    <td>{c.priority}</td>
                    <td>{c.min_watch_seconds}s</td>
                    <td>
                      <span className={`ad-match-pill ${c.is_active ? "high" : "med"}`}>
                        {c.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
