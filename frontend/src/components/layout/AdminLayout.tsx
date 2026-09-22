import { Link, Outlet, useLocation } from "react-router-dom";

export default function AdminLayout() {
  const location = useLocation();

  const isGateVideos = location.pathname.startsWith("/admin/gate-videos");
  const isRegistry = location.pathname.startsWith("/admin/campaigns");
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
            <Link to="/admin/gate-videos" className={`nav-btn ${isGateVideos ? "active" : ""}`}>
              Gate Videos
            </Link>
            <Link to="/admin/campaigns" className={`nav-btn ${isRegistry ? "active" : ""}`}>
              Campaigns
            </Link>
            <Link to="/admin/users" className={`nav-btn ${isUsers ? "active" : ""}`}>
              Users
            </Link>
            <Link to="/admin/send-campaign" className={`nav-btn ${isSendCampaign ? "active" : ""}`}>
              Send Campaign
            </Link>
            <Link to="/dashboard" className="nav-btn">
              Back to Portal
            </Link>
          </nav>
        </header>

        <Outlet />
      </div>
    </div>
  );
}
