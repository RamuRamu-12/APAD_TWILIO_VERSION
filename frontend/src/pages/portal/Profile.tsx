import { useAuth } from "../../hooks/useAuth";
import PageHeader from "../../components/ui/PageHeader";

export default function Profile() {
  const { user } = useAuth();
  if (!user) return null;

  const rows = [
    { label: "Name", value: user.name },
    { label: "Mobile", value: user.mobile },
    { label: "Email", value: user.email },
    { label: "Age", value: `${user.age} yrs` },
    { label: "Gender", value: user.gender },
    { label: "Area", value: user.area },
    { label: "Role", value: user.role },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader title="Profile" description="Your Mastercard Portal account details." />
      <div className="glass-panel user-profile-panel" style={{ maxWidth: "480px" }}>
        <div className="profile-avatar">{user.name.charAt(0).toUpperCase()}</div>
        <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>{user.name}</h2>
        {rows.map((r) => (
          <div key={r.label} className="profile-field">
            <span className="profile-field-label">{r.label}</span>
            <span className="profile-field-val">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
