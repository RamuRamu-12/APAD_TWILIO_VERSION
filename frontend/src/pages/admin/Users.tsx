import { FormEvent, useEffect, useState } from "react";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import FormField from "../../components/ui/FormField";
import PhoneInput from "../../components/ui/PhoneInput";
import { Button } from "../../components/ui/Button";
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

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = () => api.get<User[]>("/api/users").then((r) => setUsers(r.data));

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
      await api.post("/api/users", {
        name: form.name,
        mobile: form.mobile,
        email: form.email,
        age: Number(form.age),
        gender: form.gender,
        area: form.area,
      });
      setForm(emptyForm);
      await load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Could not create user";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Users" description="Add people who can receive advertisements." />

      <Card title="Add user" className="mb-8">
        <form onSubmit={create} style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <FormField label="Full name" required>
            <input
              className="form-input"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
            />
          </FormField>

          <FormField label="Mobile" required>
            <PhoneInput
              value={form.mobile}
              onChange={(mobile) => set("mobile", mobile)}
              required
            />
          </FormField>

          <FormField label="Email" required>
            <input
              type="email"
              className="form-input"
              placeholder="user@example.com"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              required
            />
          </FormField>

          <FormField label="Age" required>
            <input
              type="number"
              min={1}
              max={120}
              className="form-input"
              value={form.age}
              onChange={(e) => set("age", Number(e.target.value))}
              required
            />
          </FormField>

          <FormField label="Gender" required>
            <select
              className="form-input form-select"
              value={form.gender}
              onChange={(e) => set("gender", e.target.value)}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="any">Any</option>
            </select>
          </FormField>

          <FormField label="City" required style={{ gridColumn: "1 / -1" }}>
            <input
              className="form-input"
              placeholder="Hyderabad"
              value={form.area}
              onChange={(e) => set("area", e.target.value)}
              required
            />
          </FormField>

          {error && <p className="text-error" style={{ gridColumn: "1 / -1" }}>{error}</p>}

          <div style={{ gridColumn: "1 / -1" }}>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create user"}
            </Button>
          </div>
        </form>
      </Card>

      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Mobile</th>
              <th>Email</th>
              <th>City</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600 }}>{u.name}</td>
                <td>{u.mobile}</td>
                <td>{u.email}</td>
                <td>{u.area}</td>
                <td>
                  <span className={`ad-match-pill ${u.role === "admin" ? "med" : "high"}`}>
                    {u.role}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
