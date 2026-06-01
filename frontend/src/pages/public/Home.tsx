import { Link } from "react-router-dom";
import { LinkButton } from "../../components/ui/Button";
import { config } from "../../lib/config";

const steps = [
  { num: "01", title: "Watch offers", desc: "See brand messages picked for your profile" },
  { num: "02", title: "Verify mobile", desc: "Confirm with a secure one-time password" },
  { num: "03", title: "Browse deals", desc: "Access travel, shopping, and lifestyle offers" },
];

const features = [
  {
    title: "Relevant offers",
    desc: "Content aligned with your profile, location, and preferences.",
  },
  {
    title: "Secure sign-in",
    desc: "One-time password verification protects your account.",
  },
  {
    title: "Trusted partners",
    desc: "Offers from travel, finance, retail, and wellness brands.",
  },
];

export default function Home() {
  return (
    <div className="animate-fade-in">
      <section className="glass-panel" style={{ textAlign: "center", padding: "3rem 2rem" }}>
        <span className="badge-brand" style={{ marginBottom: "1.5rem", display: "inline-flex" }}>
          {config.tagline}
        </span>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 800, lineHeight: 1.1 }}>
          Watch. Verify. <span className="hero-gradient-text">Access.</span>
        </h1>
        <p className="text-muted" style={{ margin: "1.5rem auto 0", maxWidth: "36rem", fontSize: "1.1rem", lineHeight: 1.6 }}>
          {config.appName} helps you discover partner offers with a simple, secure mobile sign-in.
        </p>
        <div style={{ marginTop: "2.5rem", display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "center" }}>
          <LinkButton to="/register" style={{ minWidth: "180px" }}>
            Create account
          </LinkButton>
          <LinkButton to="/login" variant="secondary" style={{ minWidth: "180px" }}>
            Sign in
          </LinkButton>
        </div>
      </section>

      <section style={{ marginTop: "4rem" }}>
        <h2 className="ads-title-header" style={{ justifyContent: "center" }}>How it works</h2>
        <div className="ads-grid" style={{ marginTop: "1.5rem" }}>
          {steps.map((s) => (
            <div
              key={s.num}
              className="glass-panel"
              style={{
                textAlign: "center",
                padding: "1.5rem",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px)";
                e.currentTarget.style.boxShadow = "0 12px 30px rgba(0, 0, 0, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow = "";
              }}
            >
              <span className="hero-gradient-text" style={{ fontSize: "2rem", fontWeight: 800 }}>
                {s.num}
              </span>
              <h3 style={{ marginTop: "0.5rem", fontSize: "1.1rem" }}>{s.title}</h3>
              <p className="text-muted" style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: "4rem" }}>
        <h2 style={{ textAlign: "center", fontSize: "1.5rem", marginBottom: "1.5rem" }}>Why {config.appName}</h2>
        <div className="ads-grid">
          {features.map((f) => (
            <div
              key={f.title}
              className="glass-panel"
              style={{ padding: "1.5rem", transition: "transform 0.3s ease, border-color 0.3s" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.borderColor = "rgba(0, 242, 254, 0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "";
                e.currentTarget.style.borderColor = "";
              }}
            >
              <h3 style={{ fontSize: "1.1rem" }}>{f.title}</h3>
              <p className="text-muted" style={{ marginTop: "0.5rem", fontSize: "0.9rem", lineHeight: 1.5 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        className="glass-panel"
        style={{
          marginTop: "4rem",
          textAlign: "center",
          background: "linear-gradient(135deg, rgba(0,242,254,0.08) 0%, rgba(138,43,226,0.12) 100%)",
        }}
      >
        <h2 style={{ fontSize: "1.75rem" }}>Get started today</h2>
        <p className="text-muted" style={{ margin: "0.75rem auto 0", maxWidth: "28rem" }}>
          Create an account in minutes and unlock offers tailored to you.
        </p>
        <Link to="/register" className="submit-btn" style={{ marginTop: "2rem", display: "inline-flex", width: "auto" }}>
          Create account
        </Link>
      </section>
    </div>
  );
}
