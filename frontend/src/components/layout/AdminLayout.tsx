import { Link, Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";

const links = [
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/campaigns", label: "Campaigns", end: false },
  { to: "/admin/users", label: "Users", end: false },
  { to: "/admin/analytics", label: "Analytics", end: false },
];

function isActive(pathname: string, to: string, end: boolean) {
  if (end) return pathname === "/admin";
  return pathname === to || pathname.startsWith(`${to}/`);
}

export default function AdminLayout() {
  const location = useLocation();

  return (
    <div className="page-bg mesh-bg min-h-screen">
      <Navbar />
      <div className="app-container" style={{ minHeight: "auto", justifyContent: "flex-start" }}>
        <div className="admin-layout">
          <aside className="admin-sidebar">
            <p className="admin-sidebar-label">Management</p>
            <nav>
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`admin-sidebar-link ${isActive(location.pathname, l.to, l.end) ? "active" : ""}`}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </aside>

          <div className="admin-main">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
