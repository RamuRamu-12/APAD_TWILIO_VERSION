interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}

export default function Card({ children, className = "", title, subtitle }: CardProps) {
  return (
    <div className={`glass-panel animate-fade-in ${className}`}>
      {(title || subtitle) && (
        <div style={{ marginBottom: "1.5rem" }}>
          {title && <h2 style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>{title}</h2>}
          {subtitle && <p className="text-muted" style={{ fontSize: "0.9rem" }}>{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
