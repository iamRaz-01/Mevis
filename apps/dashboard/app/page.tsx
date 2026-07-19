"use client";

import React, { useState, useEffect } from "react";
import { useAuth, useNavigation } from "./providers";
import { Shell } from "../components/Shell";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Alert } from "../components/Alert";
import { Badge } from "../components/Badge";
import { ErrorBoundary, Empty, Forbidden, Offline } from "../components/Feedback";

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
        ) : (
          // Generic unmounted feature handler (domain-agnostic empty boundaries)
          <Empty
            title={`${currentItem?.name} Module Standby`}
            message={`The UI features and domain logic for the "${currentItem?.name}" component are unmounted. They will bind here in subsequent intelligence milestone integrations.`}
          />
        )}
      </Shell>
    </ErrorBoundary>
  );
}
