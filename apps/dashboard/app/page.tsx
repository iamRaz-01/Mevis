"use client";

import React, { useState } from "react";
import { useAuth, useNavigation } from "./providers";
import { Shell } from "../components/Shell";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Alert } from "../components/Alert";
import { Badge } from "../components/Badge";

export default function Home() {
  const { isAuthenticated, user, login } = useAuth();
  const { currentPath } = useNavigation();

  // Login form state
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput || !passwordInput) {
      setErrorMsg("Please fill in all credentials.");
      return;
    }

    // Standard logins mapping
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
        username: "Ops Coordinator",
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
      setErrorMsg("Invalid username or password. (Use: admin/password, coordinator/password, or volunteer/password)");
    }
  };

  // 1. Unauthenticated Login Screen
  if (!isAuthenticated) {
    return (
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--bg-base)",
          padding: "1rem",
        }}
      >
        <Card
          title="MEVIS Operations Command"
          subtitle="Identity Verification Gateway"
          className="glass-panel"
          style={{ width: "400px", padding: "2rem" }}
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
              Authenticate
            </Button>
          </form>

          <div style={{ marginTop: "1.5rem", fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center" }}>
            Secured using stateless JWT verification.
          </div>
        </Card>
      </div>
    );
  }

  // 2. Authenticated Experience (Inside Layout Shell)
  return (
    <Shell>
      {/* Dynamic child views mapped by active path routing */}
      {currentPath === "/dashboard" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <Card title={`Welcome Back, ${user?.username}`} subtitle="Operational Overview Panel">
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <p style={{ color: "var(--text-secondary)" }}>
                You have authenticated successfully as a member of the MEVIS platform. This dashboard serves as the standardized entry point for volunteer operations, incidents, and cognitive intelligence services.
              </p>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <Badge variant="info">User ID: {user?.id}</Badge>
                <Badge variant="success">Role: {user?.roles[0]}</Badge>
                <Badge variant="neutral">Status: Active Session</Badge>
              </div>
            </div>
          </Card>
          <div className="layout-grid">
            <Card title="Context Lineage Core" subtitle="System headers" style={{ gridColumn: "span 6" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.875rem" }}>
                <div><strong>Correlation ID:</strong> <span style={{ color: "var(--color-primary)", fontFamily: "monospace" }}>corr-root-dashboard-session</span></div>
                <div><strong>Request ID:</strong> <span style={{ color: "var(--color-primary)", fontFamily: "monospace" }}>req-ui-handshake-v1</span></div>
              </div>
            </Card>
            <Card title="Active Systems" subtitle="Platform metrics" style={{ gridColumn: "span 6" }}>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                API Gateway resolved at port 8000. Underlyings are routed via the Communication Runtime.
              </p>
            </Card>
          </div>
        </div>
      )}

      {currentPath === "/dashboard/incidents" && (
        <Card title="Incident Command" subtitle="Active Incidents Queue">
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Alert type="info" message="Incident Command systems are unmounted. Standard workflow controls will bind here in subsequent milestones." />
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-light)", textAlign: "left" }}>
                  <th style={{ padding: "0.75rem" }}>ID</th>
                  <th style={{ padding: "0.75rem" }}>Severity</th>
                  <th style={{ padding: "0.75rem" }}>Description</th>
                  <th style={{ padding: "0.75rem" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                  <td style={{ padding: "0.75rem" }}>INC-001</td>
                  <td style={{ padding: "0.75rem" }}><Badge variant="danger">HIGH</Badge></td>
                  <td style={{ padding: "0.75rem" }}>Crowd threshold alert - East Gate</td>
                  <td style={{ padding: "0.75rem" }}><Badge variant="warning">ASSESSING</Badge></td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {currentPath === "/dashboard/volunteers" && (
        <Card title="Volunteer Mobilization" subtitle="Active Personnel Registry">
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Alert type="info" message="Personnel registry systems are offline. Volunteer management logic is deferred." />
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-light)", textAlign: "left" }}>
                  <th style={{ padding: "0.75rem" }}>ID</th>
                  <th style={{ padding: "0.75rem" }}>Name</th>
                  <th style={{ padding: "0.75rem" }}>Assignment</th>
                  <th style={{ padding: "0.75rem" }}>Contact Status</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                  <td style={{ padding: "0.75rem" }}>VOL-908</td>
                  <td style={{ padding: "0.75rem" }}>Jane Doe</td>
                  <td style={{ padding: "0.75rem" }}>Sector 4 Coordination</td>
                  <td style={{ padding: "0.75rem" }}><Badge variant="success">CONNECTED</Badge></td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {currentPath === "/dashboard/context" && (
        <Card title="Context Intelligence" subtitle="Grounded Context Explorer">
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Alert type="warning" message="AI reasoning systems are unmounted. Prompt pipelines and citations will list here." />
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.875rem" }}>
              <div><strong>Core State:</strong> <span style={{ color: "var(--text-secondary)" }}>Idle</span></div>
              <div><strong>Lineage:</strong> <span style={{ color: "var(--text-secondary)" }}>None</span></div>
            </div>
          </div>
        </Card>
      )}

      {currentPath === "/dashboard/settings" && (
        <Card title="Settings" subtitle="Platform Configurations">
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Alert type="info" message="Settings modifications are restricted to active administrators." />
            <div className="form-group">
              <label className="form-label" htmlFor="env-mode">Environment Mode</label>
              <input id="env-mode" type="text" className="form-input" value="Development" readOnly />
            </div>
          </div>
        </Card>
      )}
    </Shell>
  );
}
