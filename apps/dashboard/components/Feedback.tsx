"use client";

import React, { Component, type ReactNode } from "react";
import { Card } from "./Card";
import { Button } from "./Button";

// --- Loading Component ---
export function Loading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "200px", gap: "1rem" }}>
      <div
        style={{
          width: "40px",
          height: "40px",
          border: "4px solid var(--border-light)",
          borderTop: "4px solid var(--color-primary)",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      />
      <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Loading platform context...</span>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// --- Empty Component ---
export function Empty({ title = "No Data Available", message = "No records were found in this workspace view." }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3rem", textAlign: "center", gap: "0.5rem" }}>
      <span style={{ fontSize: "3rem" }}>📁</span>
      <h3 style={{ fontSize: "1.25rem", fontWeight: 600 }}>{title}</h3>
      <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", maxWidth: "400px" }}>{message}</p>
    </div>
  );
}

// --- Offline Component ---
export function Offline() {
  return (
    <div
      style={{
        backgroundColor: "var(--color-danger)",
        color: "#fff",
        padding: "0.5rem 1rem",
        textAlign: "center",
        fontSize: "0.875rem",
        fontWeight: 600,
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.5rem",
      }}
    >
      <span>⚠️</span>
      <span>Network Connection Interrupted. Running in Offline Mode.</span>
    </div>
  );
}

// --- Unauthorized Component ---
export function Unauthorized({ onRetry }: { readonly onRetry?: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <Card title="Authentication Required" subtitle="Access Token Missing" style={{ width: "420px", textAlign: "center" }}>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
          You must verify your identity to access this operational dashboard space.
        </p>
        {onRetry && (
          <Button onClick={onRetry} variant="primary" style={{ width: "100%" }}>
            Go to Login
          </Button>
        )}
      </Card>
    </div>
  );
}

// --- Forbidden Component ---
export function Forbidden() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <Card title="Access Restricted" subtitle="Insufficient Privileges" style={{ width: "420px", textAlign: "center" }}>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
          Your security role does not have authorization to view this platform area.
        </p>
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
          Contact your event administrator to request access.
        </span>
      </Card>
    </div>
  );
}

// --- ErrorBoundary Wrapper ---
interface ErrorBoundaryProps {
  readonly children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Platform logging hook
    process.stderr.write(`[ErrorBoundary Catch]: ${error.message}\n${errorInfo.componentStack}\n`);
  }

  public override render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", padding: "1rem" }}>
          <Card title="System Error Detected" subtitle="Component Crash" style={{ width: "500px" }}>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
              An unexpected error occurred while rendering the page layout.
            </p>
            <pre
              style={{
                backgroundColor: "rgba(0,0,0,0.3)",
                padding: "0.75rem",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.75rem",
                overflowX: "auto",
                fontFamily: "monospace",
                color: "var(--color-danger)",
                marginBottom: "1.5rem",
              }}
            >
              {this.state.error?.message || "Unknown error"}
            </pre>
            <Button onClick={() => window.location.reload()} variant="secondary" style={{ width: "100%" }}>
              Reload Application
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
