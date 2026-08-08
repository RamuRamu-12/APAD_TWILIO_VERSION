import { Link } from "react-router-dom";
import { config } from "../../lib/config";

export default function SiteFooter() {
  return (
    <footer
      style={{
        marginTop: "3rem",
        padding: "1.5rem 0 2rem",
        borderTop: "1px solid var(--glass-border)",
        textAlign: "center",
        fontSize: "0.85rem",
        color: "var(--text-secondary)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", flexWrap: "wrap" }}>
        <Link to="/privacy-policy" className="text-link">
          Privacy Policy
        </Link>
        <Link to="/terms-of-service" className="text-link">
          Terms of Service
        </Link>
      </div>
      <p style={{ marginTop: "0.75rem" }}>
        &copy; {new Date().getFullYear()} {config.appName}
      </p>
    </footer>
  );
}
