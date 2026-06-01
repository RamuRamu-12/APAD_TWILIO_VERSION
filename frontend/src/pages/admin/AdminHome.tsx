import { Link } from "react-router-dom";
import PageHeader from "../../components/ui/PageHeader";

const cards = [
  {
    to: "/admin/campaigns",
    title: "Campaigns",
    desc: "Create and manage partner campaigns, creative assets, and audience rules.",
  },
  {
    to: "/admin/users",
    title: "User accounts",
    desc: "Add and review registered users and their profile details.",
  },
  {
    to: "/admin/analytics",
    title: "Analytics",
    desc: "Review sign-in funnel events and engagement metrics.",
  },
];

export default function AdminHome() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Overview"
        description="Manage campaigns, users, and performance from one place."
      />
      <div className="ads-grid">
        {cards.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="glass-panel"
            style={{
              textDecoration: "none",
              background: "linear-gradient(135deg, rgba(0,242,254,0.06) 0%, rgba(138,43,226,0.1) 100%)",
              transition: "transform 0.2s ease, border-color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.borderColor = "rgba(0, 242, 254, 0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "";
              e.currentTarget.style.borderColor = "";
            }}
          >
            <h2 style={{ fontSize: "1.15rem", marginBottom: "0.5rem" }}>{c.title}</h2>
            <p className="text-muted" style={{ fontSize: "0.9rem", lineHeight: 1.5 }}>{c.desc}</p>
            <span className="text-link" style={{ marginTop: "1rem", display: "inline-block", fontSize: "0.9rem", fontWeight: 600 }}>
              Open
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
