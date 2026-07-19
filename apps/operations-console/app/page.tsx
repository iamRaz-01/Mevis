"use client";

import React, { useState } from "react";
import { useAuth, useNavigation } from "./providers";
import { Shell } from "../components/Shell";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Alert } from "../components/Alert";
import { Badge } from "../components/Badge";
import { featureFlags, releaseInfo, metrics } from "@mevis/platform-operations";

export default function Home() {
  const { isAuthenticated, login } = useAuth();
  const { currentPath } = useNavigation();

  // Form logins state
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameInput === "sre" && passwordInput === "password") {
      login("mock-sre-jwt-token", {
        id: "u-sre",
        username: "SiteReliability",
        email: "sre@mevis.io",
        roles: ["ROLE_ADMIN"],
      });
      setErrorMsg("");
    } else {
      setErrorMsg("Unauthorized. (Use: sre/password)");
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
          title="MEVIS SRE Console"
          subtitle="Platform Diagnostics Portal"
          style={{ width: "400px", padding: "2rem" }}
        >
          <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
            <div className="form-group">
              <label className="form-label" htmlFor="username">SRE Identity</label>
              <input
                id="username"
                type="text"
                className="form-input"
                placeholder="sre"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="password">Security PIN</label>
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
              Unlock Console
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  // 2. SRE Workstation Dashboard Shell
  return (
    <Shell>
      {currentPath === "/ops/diagnostics" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <Card title="System Diagnostics" subtitle="Platform build metadata and deployments info">
            <table style={{ width: "100%", fontSize: "0.875rem", borderCollapse: "collapse", color: "var(--text-secondary)" }}>
              <tbody>
                <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                  <td style={{ padding: "0.75rem 0" }}><strong>Platform Version:</strong></td>
                  <td style={{ padding: "0.75rem 0", textAlign: "right" }}><Badge variant="info">{releaseInfo.getMetadata().version}</Badge></td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                  <td style={{ padding: "0.75rem 0" }}><strong>Target Environment:</strong></td>
                  <td style={{ padding: "0.75rem 0", textAlign: "right" }}><Badge variant="success">{releaseInfo.getMetadata().environment}</Badge></td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                  <td style={{ padding: "0.75rem 0" }}><strong>Commit SHA:</strong></td>
                  <td style={{ padding: "0.75rem 0", textAlign: "right", fontFamily: "monospace" }}>{releaseInfo.getMetadata().commitSha}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                  <td style={{ padding: "0.75rem 0" }}><strong>Build Timestamp:</strong></td>
                  <td style={{ padding: "0.75rem 0", textAlign: "right" }}>{releaseInfo.getMetadata().buildTimestamp}</td>
                </tr>
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {currentPath === "/ops/health" && (
        <Card title="Dependencies Health Aggregator" subtitle="Active readiness status monitors">
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>Overall Platform State:</span>
              <Badge variant="success">Healthy</Badge>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-light)", textAlign: "left" }}>
                  <th style={{ padding: "0.75rem 0" }}>Dependency / Resource</th>
                  <th style={{ padding: "0.75rem 0" }}>Type</th>
                  <th style={{ padding: "0.75rem 0", textAlign: "right" }}>Health State</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                  <td style={{ padding: "0.75rem 0" }}>Gateway API Route Checker</td>
                  <td style={{ padding: "0.75rem 0" }}>Critical</td>
                  <td style={{ padding: "0.75rem 0", textAlign: "right" }}><Badge variant="success">Healthy</Badge></td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                  <td style={{ padding: "0.75rem 0" }}>Identity Security Database Connection</td>
                  <td style={{ padding: "0.75rem 0" }}>Critical</td>
                  <td style={{ padding: "0.75rem 0", textAlign: "right" }}><Badge variant="success">Healthy</Badge></td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                  <td style={{ padding: "0.75rem 0" }}>Local Caching Redis Purger</td>
                  <td style={{ padding: "0.75rem 0" }}>Non-Critical</td>
                  <td style={{ padding: "0.75rem 0", textAlign: "right" }}><Badge variant="success">Healthy</Badge></td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {currentPath === "/ops/metrics" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="layout-grid">
            <Card title="System Utilization" subtitle="Host resources signals" style={{ gridColumn: "span 6" }}>
              <table style={{ width: "100%", fontSize: "0.875rem", borderCollapse: "collapse", color: "var(--text-secondary)" }}>
                <tbody>
                  <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                    <td style={{ padding: "0.5rem 0" }}><strong>Process Uptime:</strong></td>
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
                </tbody>
              </table>
            </Card>

            <Card title="Metrics Collectors" subtitle="Active telemetry stats" style={{ gridColumn: "span 6" }}>
              <table style={{ width: "100%", fontSize: "0.875rem", borderCollapse: "collapse", color: "var(--text-secondary)" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-light)", textAlign: "left" }}>
                    <th style={{ padding: "0.5rem 0" }}>Metric Name</th>
                    <th style={{ padding: "0.5rem 0" }}>Type</th>
                    <th style={{ padding: "0.5rem 0", textAlign: "right" }}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                    <td style={{ padding: "0.5rem 0" }}>http_requests_total</td>
                    <td style={{ padding: "0.5rem 0" }}>Counter</td>
                    <td style={{ padding: "0.5rem 0", textAlign: "right" }}>1824</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                    <td style={{ padding: "0.5rem 0" }}>request_latency_ms</td>
                    <td style={{ padding: "0.5rem 0" }}>Histogram</td>
                    <td style={{ padding: "0.5rem 0", textAlign: "right" }}>24.2 ms (avg)</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                    <td style={{ padding: "0.5rem 0" }}>active_ws_connections</td>
                    <td style={{ padding: "0.5rem 0" }}>Gauge</td>
                    <td style={{ padding: "0.5rem 0", textAlign: "right" }}>34</td>
                  </tr>
                </tbody>
              </table>
            </Card>
          </div>
        </div>
      )}

      {currentPath === "/ops/flags" && (
        <Card title="Dynamic Feature Configuration" subtitle="Runtime environment flag gates">
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {Object.entries(featureFlags.getAllFlags()).map(([flagName, val]) => (
              <div
                key={flagName}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.75rem 1rem",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--border-light)",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "0.875rem", fontFamily: "monospace", fontWeight: 600 }}>{flagName}</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Platform runtime gate configuration</span>
                </div>
                <Badge variant={val ? "success" : "neutral"}>
                  {val ? "ACTIVE" : "STANDBY"}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </Shell>
  );
}
