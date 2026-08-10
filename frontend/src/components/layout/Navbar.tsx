import { Link, useLocation } from "react-router-dom";
import { config } from "../../lib/config";
import { useAuth } from "../../hooks/useAuth";

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="glass-nav sticky top-0 z-50">
      <div className="app-container" style={{ minHeight: "auto", paddingTop: "1rem", paddingBottom: "1rem" }}>
        <div className="header-nav" style={{ marginBottom: 0, paddingBottom: 0, borderBottom: "none" }}>
          <Link to="/" className="mc-brand-row" style={{ textDecoration: "none", gap: "0.55rem" }}>
            <span className="mc-circles" aria-hidden="true" />
            <span className="logo" style={{ margin: 0 }}>{config.appName}</span>
          </Link>

          <nav className="nav-links">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className={`nav-btn ${isActive("/dashboard") ? "active" : ""}`}
                >
                  Dashboard
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`nav-btn ${location.pathname.startsWith("/admin") ? "active" : ""}`}
                  >
                    Admin
                  </Link>
                )}
                <span className="text-muted" style={{ fontSize: "0.9rem" }}>
                  Hi, <strong style={{ color: "var(--text-primary)" }}>{user.name.split(" ")[0]}</strong>
                </span>
                <button type="button" onClick={logout} className="nav-btn nav-btn-logout">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`nav-btn ${isActive("/login") ? "active" : ""}`}
                >
                  Login
                </Link>
                <Link to="/register" className="nav-btn nav-btn-primary">
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
