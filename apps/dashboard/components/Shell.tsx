"use client";

import React from "react";
import { useAuth, useNavigation, useTheme } from "../app/providers";

interface ShellProps {
  readonly children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  const { user, logout } = useAuth();
  const { items, currentPath, setCurrentPath } = useNavigation();
  const { theme, toggleTheme } = useTheme();

  // Filter navigation items by user role permissions
  const visibleItems = items.filter((item) => {
    if (!item.roles) return true;
    if (!user) return false;
    return item.roles.some((r) => user.roles.includes(r));
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg-base)" }}>
      {/* 1. Left Sidebar Navigation */}
      <aside
        className="glass-panel"
        style={{
          width: "260px",
          borderRadius: 0,
          borderTop: 0,
          borderBottom: 0,
          borderLeft: 0,
          display: "flex",
          flexDirection: "column",
          padding: "1.5rem 1rem",
          zIndex: 10,
        }}
      >
        {/* Brand / Logo */}
        <div style={{ padding: "0 0.5rem 2rem 0.5rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: "-0.02em" }}>
            MEVIS <span style={{ color: "var(--color-primary)", fontSize: "0.75rem", verticalAlign: "super" }}>OPS</span>
          </h2>
        </div>

        {/* Nav list */}
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {visibleItems.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => setCurrentPath(item.path)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem 1rem",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  backgroundColor: isActive ? "hsla(217, 91%, 60%, 0.15)" : "transparent",
                  color: isActive ? "var(--color-primary)" : "var(--text-secondary)",
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.875rem",
                  fontWeight: isActive ? 600 : 500,
                  transition: "var(--transition-smooth)",
                  width: "100%",
                }}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: "1rem" }}>
          <button
            onClick={logout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.75rem 1rem",
              borderRadius: "var(--radius-sm)",
              border: "none",
              backgroundColor: "transparent",
              color: "var(--color-danger)",
              cursor: "pointer",
              textAlign: "left",
              fontFamily: "var(--font-sans)",
              fontSize: "0.875rem",
              fontWeight: 500,
              width: "100%",
            }}
          >
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Workstation Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Topbar Header */}
        <header
          className="glass-panel"
          style={{
            height: "70px",
            borderRadius: 0,
            borderTop: 0,
            borderLeft: 0,
            borderRight: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 2rem",
            zIndex: 5,
          }}
        >
          {/* Breadcrumbs */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            <span>MEVIS</span>
            <span>/</span>
            <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
              {items.find((item) => item.path === currentPath)?.name || "Dashboard"}
            </span>
          </div>

          {/* User profile & Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <button
              onClick={toggleTheme}
              style={{
                background: "transparent",
                border: "none",
                fontSize: "1.25rem",
                cursor: "pointer",
              }}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>

            {user && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    backgroundColor: "var(--color-primary)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                  }}
                >
                  {user.username[0]?.toUpperCase()}
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{user.username}</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {user.roles[0]?.replace("ROLE_", "")}
                  </span>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Content Zone */}
        <main style={{ flex: 1, padding: "2rem", overflowY: "auto" }}>{children}</main>
      </div>
    </div>
  );
}
export default Shell;
