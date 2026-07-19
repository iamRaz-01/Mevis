import React from "react";

interface AlertProps {
  readonly type?: "success" | "warning" | "error" | "info";
  readonly title?: string;
  readonly message: string;
  readonly className?: string;
}

export function Alert({ type = "info", title, message, className = "" }: AlertProps) {
  const borderColors = {
    success: "var(--color-success)",
    warning: "var(--color-warning)",
    error: "var(--color-danger)",
    info: "var(--color-info)"
  };

  const bgColors = {
    success: "rgba(34, 197, 94, 0.1)",
    warning: "rgba(245, 158, 11, 0.1)",
    error: "rgba(239, 68, 68, 0.1)",
    info: "rgba(59, 130, 246, 0.1)"
  };

  return (
    <div
      className={className}
      style={{
        padding: "1rem",
        borderRadius: "var(--radius-sm)",
        borderLeft: `4px solid ${borderColors[type]}`,
        backgroundColor: bgColors[type],
        display: "flex",
        flexDirection: "column",
        gap: "0.25rem",
        color: "var(--text-primary)"
      }}
    >
      {title && <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{title}</span>}
      <span style={{ fontSize: "0.875rem", opacity: 0.9 }}>{message}</span>
    </div>
  );
}
export default Alert;
