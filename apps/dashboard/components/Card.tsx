import React from "react";

interface CardProps {
  readonly title?: string;
  readonly subtitle?: string;
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly footer?: React.ReactNode;
  readonly style?: React.CSSProperties;
}

export function Card({ title, subtitle, children, className = "", footer, style }: CardProps) {
  return (
    <div
      className={`glass-panel ${className}`}
      style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", ...style }}
    >
      {(title || subtitle) && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {title && <h3 style={{ fontSize: "1.25rem", fontWeight: 600 }}>{title}</h3>}
          {subtitle && <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{subtitle}</span>}
        </div>
      )}
      <div style={{ flex: 1 }}>{children}</div>
      {footer && (
        <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: "1rem", marginTop: "0.5rem" }}>
          {footer}
        </div>
      )}
    </div>
  );
}
export default Card;
