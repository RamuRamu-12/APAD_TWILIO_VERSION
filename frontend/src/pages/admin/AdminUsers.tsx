import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import LocationAutocomplete from "../../components/ui/LocationAutocomplete";
import PhoneInput from "../../components/ui/PhoneInput";
import { useToast } from "../../context/ToastContext";
import { api } from "../../lib/api";
import type { Location, User } from "../../types/api";

const emptyForm = {
  name: "",
  mobile: "",
  email: "",
  age: 25,
  gender: "male",
  area: "",
  marketing_opt_in: false,
};

export default function AdminUsers() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);

  const loadAll = useCallback(() => {
    return api.get<User[]>("/api/users").then((r) => setUsers(r.data));
  }, []);

  const locationNames = useMemo(
    () => locations.map((l) => l.name),
    [locations]
  );

  useEffect(() => {
    loadAll();
    api
      .get<Location[]>("/api/admin/locations")
      .then((r) => setLocations(r.data.filter((l) => l.is_active)))
      .catch(() => showToast("Could not load locations", true));
  }, [loadAll, showToast]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const startEdit = (user: User) => {
    setEditingId(user.id);
    setForm({
      name: user.name,
      mobile: user.mobile,
      email: user.email || "",
      age: user.age,
      gender: user.gender || "male",
      area: user.area || "",
      marketing_opt_in: !!user.marketing_opt_in,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      name: form.name,
      mobile: form.mobile,
      email: form.email,
      age: Number(form.age),
      gender: form.gender,
      area: form.area,
      marketing_opt_in: form.marketing_opt_in,
    };
    try {
      if (editingId == null) {
        await api.post("/api/users", payload);
        showToast("User account created");
      } else {
        await api.patch(`/api/users/${editingId}`, payload);
        showToast("User account updated");
      }
      cancelEdit();
      await loadAll();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        (editingId == null ? "Could not create user" : "Could not update user");
      showToast(String(msg), true);
    } finally {
      setLoading(false);
    }
  };

  const removeUser = async (user: User) => {
    const ok = window.confirm(
      `Delete ${user.name} (${user.mobile})?\n\nThis removes the account and related tokens, OTP logs, and ad completions.`
    );
    if (!ok) return;
    setDeletingId(user.id);
    try {
      await api.delete(`/api/users/${user.id}`);
      if (editingId === user.id) {
        cancelEdit();
      }
      await loadAll();
      showToast("User deleted");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Could not delete user";
      showToast(String(msg), true);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="admin-header">
        <div>
          <h1 style={{ fontSize: "1.75rem", marginBottom: "0.25rem" }}>User accounts</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Create, edit, and delete user accounts.
          </p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>
          {editingId == null ? "Add user" : `Edit user #${editingId}`}
        </h2>
        <form
          onSubmit={save}
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
              min={1}
              max={120}
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
            <label className="form-label">Location</label>
            <LocationAutocomplete
              value={form.area}
              onChange={(area) => set("area", area)}
              suggestions={locationNames}
              inputClassName="form-input"
              placeholder='Search location (e.g. "m" for Mumbai…)'
              allowCustom={false}
              required
              emptyHint="No matching location in admin list."
            />
          </div>
          <label
            className="form-group"
            style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer" }}
          >
            <input
              type="checkbox"
              checked={form.marketing_opt_in}
              onChange={(e) => set("marketing_opt_in", e.target.checked)}
            />
            <span className="form-label" style={{ marginBottom: 0 }}>
              Opt in to campaign emails
            </span>
          </label>
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button type="submit" className="nav-btn active" disabled={loading} style={{ color: "#000" }}>
              {loading
                ? editingId == null
                  ? "Creating…"
                  : "Saving…"
                : editingId == null
                  ? "Create user"
                  : "Save changes"}
            </button>
            {editingId != null && (
              <button type="button" className="nav-btn" onClick={cancelEdit} disabled={loading}>
                Cancel
              </button>
            )}
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
                  <th>Campaign emails</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={editingId === u.id ? { outline: "1px solid var(--accent-cyan)" } : undefined}>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td>{u.mobile}</td>
                    <td>{u.email || "—"}</td>
                    <td>{u.age}</td>
                    <td>{u.gender}</td>
                    <td>{u.area || "—"}</td>
                    <td>
                      <span className={`ad-match-pill ${u.marketing_opt_in ? "high" : "med"}`}>
                        {u.marketing_opt_in ? "Opted in" : "Opted out"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="nav-btn"
                          style={{ padding: "0.35rem 0.7rem", fontSize: "0.8rem" }}
                          onClick={() => startEdit(u)}
                          disabled={loading || deletingId === u.id}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="nav-btn nav-btn-logout"
                          style={{ padding: "0.35rem 0.7rem", fontSize: "0.8rem" }}
                          onClick={() => removeUser(u)}
                          disabled={loading || deletingId === u.id}
                        >
                          {deletingId === u.id ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </td>
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
