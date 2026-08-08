import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import SiteFooter from "./SiteFooter";

export default function AppShell() {
  return (
    <div className="page-bg mesh-bg min-h-screen">
      <Navbar />
      <main className="app-container" style={{ minHeight: "auto", justifyContent: "flex-start" }}>
        <Outlet />
        <SiteFooter />
      </main>
    </div>
  );
}
