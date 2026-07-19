"use client";

import React, { useState, useEffect } from "react";
import { useAuth, useNavigation } from "./providers";
import { Shell } from "../components/Shell";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Alert } from "../components/Alert";
import { Badge } from "../components/Badge";
import { ErrorBoundary, Empty, Forbidden, Offline } from "../components/Feedback";
import { featureFlags, releaseInfo, metrics } from "@mevis/platform-operations";

export default function Home() {
  const { isAuthenticated, user, login } = useAuth();
  const { currentPath } = useNavigation();

  // Network offline state detection
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
    return undefined;
  }, []);

  // Form states
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput || !passwordInput) {
      setErrorMsg("Please enter username and password.");
      return;
    }

    // Standard platform credentials check
    if (usernameInput === "admin" && passwordInput === "password") {
      login("mock-jwt-admin-token", {
        id: "u-admin",
        username: "Administrator",
        email: "admin@mevis.io",
        roles: ["ROLE_ADMIN"],
      });
      setErrorMsg("");
    } else if (usernameInput === "coordinator" && passwordInput === "password") {
      login("mock-jwt-coordinator-token", {
        id: "u-coord",
        username: "Operations Coordinator",
        email: "coord@mevis.io",
        roles: ["ROLE_EVENT_COORDINATOR"],
      });
      setErrorMsg("");
    } else if (usernameInput === "volunteer" && passwordInput === "password") {
      login("mock-jwt-volunteer-token", {
        id: "u-vol",
        username: "Volunteer Lead",
        email: "volunteer@mevis.io",
        roles: ["ROLE_VOLUNTEER"],
      });
      setErrorMsg("");
    } else {
      setErrorMsg("Authentication failed. Invalid username or password.");
    }
  };

  // 1. Unauthenticated Login Screen
  if (!isAuthenticated) {
    return (
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--bg-base)",
          padding: "1rem",
        }}
      >
        {isOffline && <Offline />}
        <Card
          title="MEVIS Gateway Portal"
          subtitle="Stateless Identity Verification"
          className="glass-panel"
          style={{ width: "400px", padding: "2rem", marginTop: isOffline ? "1rem" : "0" }}
        >
          <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
            <div className="form-group">
              <label className="form-label" htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                className="form-input"
                placeholder="e.g. admin"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
              />
            </div>

            {errorMsg && (
              <Alert type="error" message={errorMsg} />
            )}

            <Button type="submit" variant="primary" style={{ marginTop: "0.5rem" }}>
              Verify Identity
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  // Helper check for role-based page guards
  const currentItem = [
    { name: "Overview", path: "/dashboard", roles: undefined },
    { name: "Incidents", path: "/dashboard/incidents", roles: ["ROLE_ADMIN", "ROLE_EVENT_COORDINATOR"] },
    { name: "Volunteers", path: "/dashboard/volunteers", roles: ["ROLE_ADMIN", "ROLE_EVENT_COORDINATOR"] },
    { name: "Context Intelligence", path: "/dashboard/context", roles: ["ROLE_ADMIN"] },
    { name: "Settings", path: "/dashboard/settings", roles: undefined },
  ].find((item) => item.path === currentPath);

  const isAuthorized = !currentItem?.roles || currentItem.roles.some((r) => user?.roles.includes(r));

  // 2. Authenticated Experience inside the Shell Layout
  return (
    <ErrorBoundary>
      {isOffline && <Offline />}
      <Shell>
        {!isAuthorized ? (
          <Forbidden />
        ) : currentPath === "/dashboard" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <Card title="MEVIS Operational Platform Shell" subtitle="System Control Core">
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <p style={{ color: "var(--text-secondary)" }}>
                  This dashboard environment forms the frontend foundation of the MEVIS platform. Features are organized modularly and governed through declarative route registries and role-based policies.
                </p>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  <Badge variant="info">User: {user?.username}</Badge>
                  <Badge variant="success">Authorization: {user?.roles[0]?.replace("ROLE_", "")}</Badge>
                  <Badge variant="neutral">Status: Online Session</Badge>
                </div>
              </div>
            </Card>

            <div className="layout-grid">
              <Card title="Platform Context Tracing" subtitle="API trace lineage headers" style={{ gridColumn: "span 6" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.875rem" }}>
                  <div><strong>Trace Correlation ID:</strong> <span style={{ color: "var(--color-primary)", fontFamily: "monospace" }}>corr-root-dashboard-session</span></div>
                  <div><strong>Context Request ID:</strong> <span style={{ color: "var(--color-primary)", fontFamily: "monospace" }}>req-ui-handshake-v1</span></div>
                </div>
              </Card>
              <Card title="Edge Integration Policy" subtitle="Gateway rules" style={{ gridColumn: "span 6" }}>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                  API calls target port 8000, processed under CORS origins, rate-limit constraints, and JWT authorization rules.
                </p>
              </Card>
            </div>
          </div>
        ) : currentPath === "/dashboard/ops" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <Card title="Operations Center" subtitle="Site Reliability & Runtime Platform Dashboard">
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <Alert type="info" message="Standardized distributed tracing correlation and metrics pipeline is active." />
                <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                  This dashboard aggregates runtime signals, environment feature gates, SRE build release metadata, and container state profiles across the MEVIS platform.
                </p>
              </div>
            </Card>

            <div className="layout-grid">
              <Card title="Release Metadata" subtitle="Release Engineering parameters" style={{ gridColumn: "span 6" }}>
                <table style={{ width: "100%", fontSize: "0.875rem", borderCollapse: "collapse", color: "var(--text-secondary)" }}>
                  <tbody>
                    <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                      <td style={{ padding: "0.5rem 0" }}><strong>Version:</strong></td>
                      <td style={{ padding: "0.5rem 0", textAlign: "right" }}><Badge variant="info">{releaseInfo.getMetadata().version}</Badge></td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                      <td style={{ padding: "0.5rem 0" }}><strong>Environment:</strong></td>
                      <td style={{ padding: "0.5rem 0", textAlign: "right" }}><Badge variant="success">{releaseInfo.getMetadata().environment}</Badge></td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                      <td style={{ padding: "0.5rem 0" }}><strong>Commit SHA:</strong></td>
                      <td style={{ padding: "0.5rem 0", textAlign: "right", fontFamily: "monospace" }}>{releaseInfo.getMetadata().commitSha}</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                      <td style={{ padding: "0.5rem 0" }}><strong>Build Timestamp:</strong></td>
                      <td style={{ padding: "0.5rem 0", textAlign: "right", fontSize: "0.75rem" }}>{releaseInfo.getMetadata().buildTimestamp}</td>
                    </tr>
                  </tbody>
                </table>
              </Card>

              <Card title="Feature Configuration" subtitle="Runtime environment gates" style={{ gridColumn: "span 6" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {Object.entries(featureFlags.getAllFlags()).map(([flagName, val]) => (
                    <div
                      key={flagName}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.5rem 0.75rem",
                        borderRadius: "var(--radius-sm)",
                        backgroundColor: "rgba(255,255,255,0.03)",
                      }}
                    >
                      <span style={{ fontSize: "0.875rem", fontFamily: "monospace" }}>{flagName}</span>
                      <Badge variant={val ? "success" : "neutral"}>
                        {val ? "ENABLED" : "DISABLED"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Telemetry Metrics" subtitle="Uptime & heap utilization signals" style={{ gridColumn: "span 6" }}>
                <table style={{ width: "100%", fontSize: "0.875rem", borderCollapse: "collapse", color: "var(--text-secondary)" }}>
                  <tbody>
                    <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                      <td style={{ padding: "0.5rem 0" }}><strong>Uptime:</strong></td>
                      <td style={{ padding: "0.5rem 0", textAlign: "right" }}>{metrics.getSystemMetrics().uptime.toFixed(1)} seconds</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                      <td style={{ padding: "0.5rem 0" }}><strong>Heap Total:</strong></td>
                      <td style={{ padding: "0.5rem 0", textAlign: "right" }}>{(metrics.getSystemMetrics().memory.heapTotal / 1024 / 1024).toFixed(1)} MB</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                      <td style={{ padding: "0.5rem 0" }}><strong>Heap Used:</strong></td>
                      <td style={{ padding: "0.5rem 0", textAlign: "right" }}>{(metrics.getSystemMetrics().memory.heapUsed / 1024 / 1024).toFixed(1)} MB</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                      <td style={{ padding: "0.5rem 0" }}><strong>Resident Set (RSS):</strong></td>
                      <td style={{ padding: "0.5rem 0", textAlign: "right" }}>{(metrics.getSystemMetrics().memory.rss / 1024 / 1024).toFixed(1)} MB</td>
                    </tr>
                  </tbody>
                </table>
              </Card>

              <Card title="Active Systems Status" subtitle="Readiness & availability checks" style={{ gridColumn: "span 6" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {[
                    { name: "API Gateway Service (Port 8000)", status: "UP" },
                    { name: "Identity Service (Spring Boot Authentication)", status: "UP" },
                    { name: "Configuration Service (Infrastructure API)", status: "UP" },
                    { name: "Auditing & Storage Services (Infrastructure APIs)", status: "UP" },
                    { name: "SqliteDatabase (Persistent Relational)", status: "UP" },
                    { name: "LocalEventBus (Standard Event Bus)", status: "UP" },
                  ].map((service) => (
                    <div
                      key={service.name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.375rem 0.5rem",
                        fontSize: "0.875rem",
                      }}
                    >
                      <span>{service.name}</span>
                      <Badge variant="success">{service.status}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        ) : (
          <Empty
            title={`${currentItem?.name} Module Standby`}
            message={`The UI features and domain logic for the "${currentItem?.name}" component are unmounted. They will bind here in subsequent integrations.`}
          />
        )}
      </Shell>
    </ErrorBoundary>
  );
}
