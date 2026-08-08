import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { config } from "../../lib/config";

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}

export default function LegalPageLayout({ title, lastUpdated, children }: LegalPageLayoutProps) {
  return (
    <div className="animate-fade-in" style={{ maxWidth: "720px", margin: "2rem auto", paddingBottom: "3rem" }}>
      <div className="glass-panel" style={{ padding: "2rem 2.25rem" }}>
        <h1 style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>{title}</h1>
        <p className="text-muted" style={{ fontSize: "0.85rem", marginBottom: "2rem" }}>
          Last updated: {lastUpdated} · {config.appName}
        </p>
        <div
          className="legal-prose"
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.95rem",
            lineHeight: 1.7,
          }}
        >
          {children}
        </div>
        <div
          style={{
            marginTop: "2.5rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid var(--glass-border)",
            display: "flex",
            gap: "1.5rem",
            flexWrap: "wrap",
            fontSize: "0.875rem",
          }}
        >
          <Link to="/privacy-policy" className="text-link">
            Privacy Policy
          </Link>
          <Link to="/terms-of-service" className="text-link">
            Terms of Service
          </Link>
          <Link to="/" className="text-link">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
