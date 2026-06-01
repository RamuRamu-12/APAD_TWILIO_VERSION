interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  className?: string;
}

export default function PageHeader({ title, description, badge, className = "" }: PageHeaderProps) {
  return (
    <div className={`animate-fade-in ${className}`} style={{ marginBottom: "2rem" }}>
      {badge && <span className="badge-brand" style={{ marginBottom: "0.75rem", display: "inline-flex" }}>{badge}</span>}
      <h1 className="hero-gradient-text" style={{ fontSize: "2rem", fontWeight: 800 }}>
        {title}
      </h1>
      {description && (
        <p className="text-muted" style={{ marginTop: "0.75rem", fontSize: "1rem", maxWidth: "36rem" }}>
          {description}
        </p>
      )}
    </div>
  );
}
