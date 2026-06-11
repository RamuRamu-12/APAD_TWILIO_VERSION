import { useCallback, useEffect, useMemo, useState } from "react";
import SendCampaignModal from "../../components/admin/SendCampaignModal";
import { useToast } from "../../context/ToastContext";
import { api } from "../../lib/api";
import type { SendCampaignEmailResponse, User, UserSearchParams } from "../../types/api";

const emptyFilters = {
  min_age: "",
  max_age: "",
  gender: "any",
  area: "",
  q: "",
};

function hasValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function AdminSendCampaign() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [searching, setSearching] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendResult, setSendResult] = useState<SendCampaignEmailResponse | null>(null);

  const loadAll = useCallback(() => {
    return api.get<User[]>("/api/users").then((r) => setUsers(r.data));
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const buildSearchParams = (): UserSearchParams => {
    const p: UserSearchParams = {};
    if (filters.min_age) p.min_age = Number(filters.min_age);
    if (filters.max_age) p.max_age = Number(filters.max_age);
    if (filters.gender && filters.gender !== "any") p.gender = filters.gender;
    if (filters.area.trim()) p.area = filters.area.trim();
    if (filters.q.trim()) p.q = filters.q.trim();
    return p;
  };

  const runSearch = async () => {
    setSearching(true);
    try {
      const params = buildSearchParams();
      const { data } = await api.get<User[]>("/api/users/search", { params });
      setUsers(data);
    } catch {
      showToast("Search failed", true);
    } finally {
      setSearching(false);
    }
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
    loadAll();
  };

  const toggleUser = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectableUsers = useMemo(() => users.filter((u) => hasValidEmail(u.email)), [users]);

  const selectAllFiltered = () => {
    setSelected(new Set(selectableUsers.map((u) => u.id)));
  };

  const clearSelection = () => setSelected(new Set());

  const allPageSelected =
    selectableUsers.length > 0 && selectableUsers.every((u) => selected.has(u.id));

  const togglePage = () => {
    if (allPageSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        selectableUsers.forEach((u) => next.delete(u.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        selectableUsers.forEach((u) => next.add(u.id));
        return next;
      });
    }
  };

  const selectedIds = useMemo(() => Array.from(selected), [selected]);

  const onSendComplete = (result: SendCampaignEmailResponse) => {
    setShowSendModal(false);
    setSendResult(result);
    clearSelection();
    const msg = `Sent ${result.sent}, skipped ${result.skipped}, failed ${result.failed}`;
    showToast(msg, result.failed > 0 && result.sent === 0);
  };

  return (
    <div className="animate-fade-in">
      <div className="admin-header">
        <div>
          <h1 style={{ fontSize: "1.75rem", marginBottom: "0.25rem" }}>Send campaign</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Filter users, select recipients, and send campaign offers by email.
          </p>
        </div>
        <button
          type="button"
          className="nav-btn active"
          disabled={selectedIds.length === 0}
          onClick={() => setShowSendModal(true)}
          style={{ padding: "0.7rem 1.4rem", borderRadius: "12px", color: "#000" }}
        >
          Send Campaign ({selectedIds.length})
        </button>
      </div>

      <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Filter users</h2>
        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            alignItems: "end",
          }}
        >
          <div className="form-group">
            <label className="form-label">Min age</label>
            <input
              type="number"
              className="form-input"
              value={filters.min_age}
              onChange={(e) => setFilters((f) => ({ ...f, min_age: e.target.value }))}
              min={0}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Max age</label>
            <input
              type="number"
              className="form-input"
              value={filters.max_age}
              onChange={(e) => setFilters((f) => ({ ...f, max_age: e.target.value }))}
              min={0}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Gender</label>
            <select
              className="form-input form-select"
              value={filters.gender}
              onChange={(e) => setFilters((f) => ({ ...f, gender: e.target.value }))}
            >
              <option value="any">Any</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">City / area</label>
            <input
              className="form-input"
              placeholder="e.g. Mumbai"
              value={filters.area}
              onChange={(e) => setFilters((f) => ({ ...f, area: e.target.value }))}
            />
          </div>
          <div className="form-group" style={{ gridColumn: "span 2" }}>
            <label className="form-label">Search name, email, mobile</label>
            <input
              className="form-input"
              value={filters.q}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            />
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button type="button" className="nav-btn active" onClick={runSearch} disabled={searching} style={{ color: "#000" }}>
              {searching ? "Searching…" : "Search"}
            </button>
            <button type="button" className="nav-btn" onClick={clearFilters}>
              Clear
            </button>
          </div>
        </div>
        <p style={{ marginTop: "1rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          {selectedIds.length} selected · {users.length} shown
          {selectableUsers.length < users.length && (
            <span> · {users.length - selectableUsers.length} without valid email (cannot select)</span>
          )}
        </p>
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
          <button type="button" className="nav-btn" onClick={selectAllFiltered}>
            Select all filtered
          </button>
          <button type="button" className="nav-btn" onClick={clearSelection}>
            Clear selection
          </button>
        </div>
      </div>

      {sendResult && (
        <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Last send result</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
            Sent: {sendResult.sent} · Skipped: {sendResult.skipped} · Failed: {sendResult.failed}
          </p>
          <ul style={{ fontSize: "0.85rem", color: "var(--text-secondary)", paddingLeft: "1.25rem" }}>
            {sendResult.results.map((r) => (
              <li key={`${r.user_id}-${r.status}`}>
                User #{r.user_id}: {r.status}
                {r.message ? ` — ${r.message}` : ""}
              </li>
            ))}
          </ul>
          <button type="button" className="nav-btn" style={{ marginTop: "1rem" }} onClick={() => setSendResult(null)}>
            Dismiss
          </button>
        </div>
      )}

      <div className="glass-panel" style={{ padding: "1.5rem" }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Recipients ({users.length})</h2>
        {users.length === 0 ? (
          <p style={{ color: "var(--text-secondary)" }}>No users match your filters.</p>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 48 }}>
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      onChange={togglePage}
                      aria-label="Select all on page"
                    />
                  </th>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>Email</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>City</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const canSelect = hasValidEmail(u.email);
                  return (
                    <tr key={u.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selected.has(u.id)}
                          disabled={!canSelect}
                          onChange={() => toggleUser(u.id)}
                          title={canSelect ? "Select user" : "No valid email"}
                          aria-label={`Select ${u.name}`}
                        />
                      </td>
                      <td style={{ fontWeight: 600 }}>{u.name}</td>
                      <td>{u.mobile}</td>
                      <td style={{ color: canSelect ? undefined : "var(--accent-rose)" }}>{u.email || "—"}</td>
                      <td>{u.age}</td>
                      <td>{u.gender}</td>
                      <td>{u.area || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showSendModal && (
        <SendCampaignModal
          userIds={selectedIds}
          onClose={() => setShowSendModal(false)}
          onComplete={onSendComplete}
        />
      )}
    </div>
  );
}
