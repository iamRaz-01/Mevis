import React from "react";

interface BadgeProps {
  readonly variant?: "success" | "warning" | "danger" | "info" | "neutral";
  readonly children: React.ReactNode;
  readonly className?: string;
}

export function Badge({ variant = "neutral", children, className = "" }: BadgeProps) {
  const colors = {
    success: { bg: "rgba(34, 197, 94, 0.15)", text: "hsl(142, 71%, 55%)" },
    warning: { bg: "rgba(245, 158, 11, 0.15)", text: "hsl(38, 92%, 60%)" },
    danger: { bg: "rgba(239, 68, 68, 0.15)", text: "hsl(0, 84%, 65%)" },
    info: { bg: "rgba(59, 130, 246, 0.15)", text: "hsl(217, 91%, 65%)" },
    neutral: { bg: "rgba(156, 163, 175, 0.15)", text: "var(--text-secondary)" }
  };

  const scheme = colors[variant];

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "0.125rem 0.5rem",
        borderRadius: "var(--radius-full)",
        fontSize: "0.75rem",
        fontWeight: 600,
        backgroundColor: scheme.bg,
        color: scheme.text,
        width: "fit-content"
      }}
    >
      {children}
    </span>
  );
}
export default Badge;
