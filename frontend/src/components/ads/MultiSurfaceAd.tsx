interface Props {
  title: string;
  imageUrl: string;
  compact?: boolean;
}

export default function MultiSurfaceAd({ title, imageUrl, compact }: Props) {
  return (
    <div
      className={`ad-card ${compact ? "" : ""}`}
      style={compact ? { maxWidth: "100%" } : undefined}
    >
      <div className="ad-image-container" style={compact ? { height: "100px" } : undefined}>
        <img src={imageUrl} alt={title} className="ad-image" />
      </div>
      <div className="ad-content" style={compact ? { padding: "0.75rem" } : undefined}>
        <p className="ad-title" style={compact ? { fontSize: "0.9rem" } : undefined}>
          {title}
        </p>
      </div>
    </div>
  );
}
