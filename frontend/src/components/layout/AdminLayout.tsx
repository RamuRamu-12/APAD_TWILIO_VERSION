import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const isRegistry =
    location.pathname === "/admin" || location.pathname === "/admin/campaigns";
  const isUsers = location.pathname.startsWith("/admin/users");
  const isSendCampaign = location.pathname.startsWith("/admin/send-campaign");

  return (
    <div className="page-bg mesh-bg min-h-screen">
      <div className="app-container" style={{ minHeight: "auto", justifyContent: "flex-start" }}>
        <header className="header-nav">
          <div className="logo">
            <span aria-hidden>⚙️</span> Ad Control Center
          </div>
          <nav className="nav-links">
            <Link to="/admin" className={`nav-btn ${isRegistry ? "active" : ""}`}>
              Ads Registry
            </Link>
            <Link to="/admin/users" className={`nav-btn ${isUsers ? "active" : ""}`}>
              Users
            </Link>
            <Link to="/admin/send-campaign" className={`nav-btn ${isSendCampaign ? "active" : ""}`}>
              Send Campaign
            </Link>
            <button type="button" className="nav-btn" onClick={() => navigate("/dashboard")}>
              Back to Portal
            </button>
          </nav>
        </header>

        <Outlet />
      </div>
    </div>
  );
}
