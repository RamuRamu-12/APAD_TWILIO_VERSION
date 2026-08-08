import { FormEvent, useCallback, useEffect, useState } from "react";
import PhoneInput from "../../components/ui/PhoneInput";
import SmsConsentCheckbox from "../../components/legal/SmsConsentCheckbox";
import { useToast } from "../../context/ToastContext";
import { api } from "../../lib/api";
import type { User } from "../../types/api";

const emptyForm = {
  name: "",
  mobile: "",
  email: "",
  age: 25,
  gender: "male",
  area: "",
};

export default function AdminUsers() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [smsConsent, setSmsConsent] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadAll = useCallback(() => {
    return api.get<User[]>("/api/users").then((r) => setUsers(r.data));
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (!smsConsent) {
      showToast("SMS consent is required when creating a user", true);
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/users", {
        name: form.name,
        mobile: form.mobile,
        email: form.email,
        age: Number(form.age),
        gender: form.gender,
        area: form.area,
        sms_consent: true,
      });
      setForm(emptyForm);
      setSmsConsent(false);
      await loadAll();
      showToast("User account created");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Could not create user";
      showToast(String(msg), true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="admin-header">
        <div>
          <h1 style={{ fontSize: "1.75rem", marginBottom: "0.25rem" }}>User accounts</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Create and manage user accounts.
          </p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Add user</h2>
        <form
          onSubmit={create}
          style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}
        >
          <div className="form-group">
            <label className="form-label">Full name *</label>
            <input className="form-input" value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Mobile *</label>
            <PhoneInput value={form.mobile} onChange={(mobile) => set("mobile", mobile)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input
              type="email"
              className="form-input"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Age</label>
            <input
              type="number"
              className="form-input"
              value={form.age}
              onChange={(e) => set("age", Number(e.target.value))}
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
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">City</label>
            <input className="form-input" value={form.area} onChange={(e) => set("area", e.target.value)} />
          </div>
          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <SmsConsentCheckbox id="admin-sms-consent" checked={smsConsent} onChange={setSmsConsent} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <button type="submit" className="nav-btn active" disabled={loading} style={{ color: "#000" }}>
              {loading ? "Creating…" : "Create user"}
            </button>
          </div>
        </form>
      </div>

      <div className="glass-panel" style={{ padding: "1.5rem" }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Registered users ({users.length})</h2>
        {users.length === 0 ? (
          <p style={{ color: "var(--text-secondary)" }}>No users yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>Email</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>City</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td>{u.mobile}</td>
                    <td>{u.email || "—"}</td>
                    <td>{u.age}</td>
                    <td>{u.gender}</td>
                    <td>{u.area || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
