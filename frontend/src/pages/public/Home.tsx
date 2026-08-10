import { LinkButton } from "../../components/ui/Button";
import { config } from "../../lib/config";

const steps = [
  { num: "01", title: "Sign in", desc: "Open the site and enter your registered mobile number" },
  { num: "02", title: "Watch one ad", desc: "A short sponsored message plays before verification" },
  { num: "03", title: "Enter OTP", desc: "Confirm the one-time password sent to your phone" },
  { num: "04", title: "Bank dashboard", desc: "View your balance and recent card transactions" },
];

export default function Home() {
  return (
    <div className="animate-fade-in mc-home">
      <section className="mc-panel" style={{ textAlign: "center", padding: "3rem 2rem" }}>
        <div className="mc-brand-row" style={{ justifyContent: "center", marginBottom: "1.5rem" }}>
          <span className="mc-circles" aria-hidden="true" />
          <span className="mc-brand-name">{config.appName}</span>
        </div>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)", fontWeight: 800, lineHeight: 1.1 }}>
          Sign in. Watch. <span className="mc-hero-accent">Bank.</span>
        </h1>
        <p className="text-muted" style={{ margin: "1.5rem auto 0", maxWidth: "36rem", fontSize: "1.1rem", lineHeight: 1.6 }}>
          Secure mobile login with a single sponsored message, then your {config.appName} bank dashboard.
        </p>
        <div style={{ marginTop: "2.5rem", display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "center" }}>
          <LinkButton to="/login" className="mc-btn" style={{ minWidth: "180px" }}>
            Sign in
          </LinkButton>
          <LinkButton to="/register" variant="secondary" style={{ minWidth: "180px" }}>
            Create account
          </LinkButton>
        </div>
      </section>

      <section style={{ marginTop: "3.5rem" }}>
        <h2 className="ads-title-header" style={{ justifyContent: "center" }}>How it works</h2>
        <div className="mc-steps-grid">
          {steps.map((s) => (
            <div key={s.num} className="mc-panel mc-step-card">
              <span className="mc-step-num">{s.num}</span>
              <h3>{s.title}</h3>
              <p className="text-muted">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
