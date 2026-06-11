import { Link } from "react-router-dom";

export default function AdComplete() {
  return (
    <div className="animate-fade-in" style={{ maxWidth: "32rem", margin: "2rem auto" }}>
      <div className="glass-panel" style={{ textAlign: "center", padding: "2.5rem 2rem" }}>
        <span className="badge-brand" style={{ marginBottom: "1rem", display: "inline-flex" }}>
          Offer viewed
        </span>
        <h1 style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>Thank you</h1>
        <p className="text-muted" style={{ lineHeight: 1.6 }}>
          You have finished viewing this personalized offer. No further action is required.
        </p>
        <Link
          to="/"
          className="nav-btn"
          style={{ display: "inline-block", marginTop: "2rem", textDecoration: "none" }}
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
