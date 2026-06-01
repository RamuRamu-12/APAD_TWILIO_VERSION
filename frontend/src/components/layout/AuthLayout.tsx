import { ReactNode } from "react";
import { Link } from "react-router-dom";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div
      className="flex min-h-[calc(100vh-6rem)] items-center justify-center py-12 animate-fade-in"
      style={{ width: "100%" }}
    >
      <div style={{ width: "100%", maxWidth: "520px" }}>
        <Link to="/" className="back-btn" style={{ marginBottom: "1.5rem", display: "inline-flex" }}>
          ← Back to home
        </Link>
        <div className="glass-panel">
          <h1 className="form-title">{title}</h1>
          {subtitle && <p className="form-subtitle">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}
