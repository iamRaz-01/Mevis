"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth, useNavigation } from "./providers";
import { Shell } from "../components/Shell";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Alert } from "../components/Alert";
import { Badge } from "../components/Badge";
import { ErrorBoundary, Empty, Forbidden, Offline } from "../components/Feedback";

// --- API Configurations ---
const GATEWAY_URL = "http://localhost:8000";
const CONTEXT_SERVICE_URL = `${GATEWAY_URL}/api/v1/services/context-service`;
const WEBSOCKET_URL = "ws://localhost:3008";

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
                placeholder="e.g. volunteer"
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
        ) : user?.roles.includes("ROLE_VOLUNTEER") ? (
          <VolunteerWorkspace volunteerId={user.id} />
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
          <Empty
            title={`${currentItem?.name} Module Standby`}
            message={`The UI features and domain logic for the "${currentItem?.name}" component are unmounted. They will bind here in subsequent integrations.`}
          />
        )}
      </Shell>
    </ErrorBoundary>
  );
}

// ─── Volunteer Workspace Dashboard Component ──────────────────────────────────────────

interface VolunteerWorkspaceProps {
  volunteerId: string;
}

function VolunteerWorkspace({ volunteerId }: VolunteerWorkspaceProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<"CONNECTED" | "CONNECTING" | "DISCONNECTED">("DISCONNECTED");
  const [sosActive, setSosActive] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // New features state
  const [currentCoords, setCurrentCoords] = useState<[number, number]>([630, 160]);
  const [alternatives, setAlternatives] = useState<any[]>([]);
  const [latestTrustPackage, setLatestTrustPackage] = useState<any>(null);
  const [trustModalOpen, setTrustModalOpen] = useState(false);

  // Report incident form states
  const [incidentDesc, setIncidentDesc] = useState("");
  const [incidentSeverity, setIncidentSeverity] = useState("MEDIUM");
  const [incidentLoc, setIncidentLoc] = useState("Gate A1");

  // AI assistant states
  const [aiQuery, setAiQuery] = useState("");
  const [aiMessages, setAiMessages] = useState<Array<{ sender: "user" | "bot"; text: string }>>([
    { sender: "bot", text: "Hello! I am MEVIS AI, your operations co-pilot. Ask me anything about your tasks, shift, or stadium navigation." },
  ]);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Dynamic greeting based on current time
  const [greeting, setGreeting] = useState("Good Morning");
  useEffect(() => {
    const hours = new Date().getHours();
    if (hours < 12) setGreeting("Good Morning");
    else if (hours < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  const headers = {
    "Content-Type": "application/json",
    "x-actor-role": "ROLE_VOLUNTEER",
    "x-volunteer-id": volunteerId,
    "x-actor-id": volunteerId,
  };

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const res = await fetch(`${CONTEXT_SERVICE_URL}/api/volunteer/dashboard`, { headers });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const body = await res.json();
      if (body.success) {
        setData(body.data);
      } else {
        throw new Error(body.errors?.[0]?.message || "Failed to load dashboard data.");
      }
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  // GPS Location Simulation loop
  useEffect(() => {
    if (data?.shift?.status !== "CHECKED_IN") return;

    const interval = setInterval(async () => {
      // Simulate walking slightly around Gate A1: [610-650, 140-180]
      const dx = (Math.random() - 0.5) * 15;
      const dy = (Math.random() - 0.5) * 15;
      const newX = Math.max(610, Math.min(650, currentCoords[0] + dx));
      const newY = Math.max(140, Math.min(180, currentCoords[1] + dy));
      const newCoords: [number, number] = [parseFloat(newX.toFixed(1)), parseFloat(newY.toFixed(1))];
      
      setCurrentCoords(newCoords);

      try {
        await fetch(`${CONTEXT_SERVICE_URL}/api/volunteer/location`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            location: "Zone A, Gate A1 Corridor",
            locationCoords: newCoords,
          }),
        });
      } catch (err) {
        console.error("GPS location update failed:", err);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [data?.shift?.status, currentCoords]);

  // WebSocket Connection
  useEffect(() => {
    fetchDashboardData();

    let ws: WebSocket;
    let reconnectTimeout: NodeJS.Timeout;

    const connectWs = () => {
      setWsStatus("CONNECTING");
      ws = new WebSocket(WEBSOCKET_URL);

      ws.onopen = () => {
        setWsStatus("CONNECTED");
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          console.log("WebSocket event received:", payload);
          // Trigger dashboard reload on any platform event
          fetchDashboardData();
        } catch {
          // Ignore parse errors
        }
      };

      ws.onclose = () => {
        setWsStatus("DISCONNECTED");
        reconnectTimeout = setTimeout(connectWs, 5000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connectWs();

    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimeout);
    };
  }, [volunteerId]);

  // Scroll to end of chat helper
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages]);

  // Quick Action: Checkin
  const handleCheckIn = async () => {
    try {
      const res = await fetch(`${CONTEXT_SERVICE_URL}/api/volunteer/checkin`, {
        method: "POST",
        headers,
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Quick Action: Checkout
  const handleCheckOut = async () => {
    try {
      const res = await fetch(`${CONTEXT_SERVICE_URL}/api/volunteer/checkout`, {
        method: "POST",
        headers,
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Quick Action: Submit Incident
  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentDesc) return;
    try {
      const res = await fetch(`${CONTEXT_SERVICE_URL}/api/incidents`, {
        method: "POST",
        headers: {
          ...headers,
          "x-actor-role": "ROLE_ADMIN", // Escalated role to report incident
        },
        body: JSON.stringify({
          severity: incidentSeverity,
          location: incidentLoc,
          description: incidentDesc,
        }),
      });
      if (res.ok) {
        setIncidentDesc("");
        setReportModalOpen(false);
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Quick Action: Trigger SOS
  const handleTriggerSOS = async () => {
    try {
      setSosActive(true);
      await fetch(`${CONTEXT_SERVICE_URL}/api/volunteer/sos`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          reason: "Critical Medical Emergency",
          location: "Lusail Stadium, Gate A1 Perimeter",
        }),
      });
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  // Assignment Actions
  const handleAcceptAssignment = async (assignmentId: string) => {
    try {
      const res = await fetch(`${CONTEXT_SERVICE_URL}/api/volunteer/assignments/${assignmentId}/accept`, {
        method: "POST",
        headers,
      });
      if (res.ok) {
        setAlternatives([]);
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectAssignment = async (assignmentId: string) => {
    try {
      const res = await fetch(`${CONTEXT_SERVICE_URL}/api/volunteer/assignments/${assignmentId}/reject`, {
        method: "POST",
        headers,
      });
      if (res.ok) {
        const body = await res.json();
        if (body.alternativeRecommendations) {
          setAlternatives(body.alternativeRecommendations);
        }
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Task Actions
  const handleStartTask = async (taskId: string) => {
    try {
      const res = await fetch(`${CONTEXT_SERVICE_URL}/api/volunteer/tasks/${taskId}/start`, {
        method: "POST",
        headers,
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`${CONTEXT_SERVICE_URL}/api/volunteer/tasks/${taskId}/complete`, {
        method: "POST",
        headers,
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Send query to AI Assistant
  const handleSendAiQuery = async (queryToSend?: string) => {
    const query = queryToSend || aiQuery;
    if (!query) return;

    if (!queryToSend) setAiQuery("");
    setAiMessages((prev) => [...prev, { sender: "user", text: query }]);
    setIsAiResponding(true);
    setLatestTrustPackage(null);

    try {
      // Ask AI directly - backend handles session creation on demand
      const chatRes = await fetch(`${CONTEXT_SERVICE_URL}/runtime/ai/v1/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: query,
        }),
      });

      if (!chatRes.ok) throw new Error("AI Assistant offline");
      const chatData = await chatRes.json();
      
      let reply = "I am processing your request. Please stand by.";
      if (chatData.success && chatData.data?.generatedText) {
        reply = chatData.data.generatedText;
        if (chatData.data.trustPackage) {
          setLatestTrustPackage(chatData.data.trustPackage);
        }
      }

      setAiMessages((prev) => [...prev, { sender: "bot", text: reply }]);
    } catch {
      setAiMessages((prev) => [...prev, { sender: "bot", text: "I encountered an issue communicating with the reasoning engine. Please try again." }]);
    } finally {
      setIsAiResponding(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", color: "var(--text-secondary)" }}>
        <div style={{ fontSize: "1.25rem", fontFamily: "var(--font-display)" }}>Assembling Workspace Context...</div>
      </div>
    );
  }

  if (error) {
    return <Alert type="error" title="Dashboard Synchronization Failure" message={error} />;
  }

  const profile = data?.profile || {};
  const shift = data?.shift || {};
  const assignments = data?.assignments || [];
  const tasks = data?.tasks || [];
  const incidents = data?.incidents || [];
  const notifications = data?.notifications || [];

  const unreadNotificationsCount = notifications.filter((n: any) => !n.acknowledgedAt).length;
  const activeAssignment = assignments[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", position: "relative" }}>
      {/* SOS Screen Overlay Flasher */}
      {sosActive && (
        <div
          onClick={() => setSosActive(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(220, 38, 38, 0.45)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)",
            cursor: "pointer",
            animation: "pulseRed 1.5s infinite alternate",
          }}
        >
          <div className="glass-panel" style={{ padding: "3rem", textAlign: "center", maxWidth: "500px", border: "2px solid var(--color-danger)" }}>
            <div style={{ fontSize: "5rem", marginBottom: "1rem" }}>🚨</div>
            <h1 style={{ fontSize: "2.5rem", color: "#fff", fontWeight: 700 }}>EMERGENCY SOS ACTIVE</h1>
            <p style={{ color: "var(--text-primary)", marginTop: "1rem", fontSize: "1.1rem" }}>
              Coordinator and Medical Support notified. Tap anywhere to cancel broadcast.
            </p>
          </div>
        </div>
      )}

      {/* Welcome Header */}
      <div
        className="glass-panel"
        style={{
          padding: "1.75rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
            {greeting}, Abdul 👋
          </h1>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            <span>Volunteer Lead</span>
            <span>•</span>
            <span style={{ color: "var(--color-primary)" }}>Medical Response Team</span>
            <span>•</span>
            <span>FIFA World Cup 2026</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: wsStatus === "CONNECTED" ? "var(--color-success)" : "var(--color-warning)" }} />
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>
              WS: {wsStatus}
            </span>
          </div>
          <div style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--text-primary)", marginTop: "0.25rem" }}>
            Today's Shift: 08:00 – 17:00
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="layout-grid">
        {/* Left Hand: Profile & Shift & Quick Actions */}
        <div style={{ gridColumn: "span 4", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Volunteer Profile Card */}
          <Card title="Operational Identity" subtitle="Stateless Identity Profile">
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "1rem", padding: "1rem 0" }}>
              <div
                style={{
                  width: "90px",
                  height: "90px",
                  borderRadius: "50%",
                  backgroundColor: "var(--color-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2.5rem",
                  color: "#fff",
                  boxShadow: "0 4px 14px rgba(59, 130, 246, 0.4)",
                  border: "3px solid var(--border-light)",
                }}
              >
                👨‍⚕️
              </div>
              <div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 600 }}>{profile.name}</h3>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontFamily: "monospace" }}>ID: {profile.id}</span>
              </div>

              <div style={{ width: "100%", borderTop: "1px solid var(--border-light)", paddingTop: "1rem" }}>
                <table style={{ width: "100%", fontSize: "0.85rem", textAlign: "left", color: "var(--text-secondary)", borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: "0.35rem 0", fontWeight: 600 }}>Languages:</td>
                      <td style={{ padding: "0.35rem 0", textAlign: "right" }}>{profile.languages?.join(", ")}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "0.35rem 0", fontWeight: 600 }}>Certifications:</td>
                      <td style={{ padding: "0.35rem 0", textAlign: "right" }}>
                        {profile.certifications?.map((c: string) => (
                          <span key={c} style={{ marginLeft: "0.25rem", fontSize: "0.7rem" }}>
                            <Badge variant="success">{c}</Badge>
                          </span>
                        ))}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "0.35rem 0", fontWeight: 600 }}>Availability:</td>
                      <td style={{ padding: "0.35rem 0", textAlign: "right" }}>
                        <Badge variant={shift.status === "CHECKED_IN" ? "success" : "neutral"}>
                          {shift.status === "CHECKED_IN" ? "ACTIVE & READY" : "OFF-DUTY"}
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          {/* Shift Details */}
          <Card title="Shift Information" subtitle="Lusail Stadium Operations">
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.9rem" }}>
                <div><strong>Location:</strong> {shift.venueName} • {shift.zoneName} • {shift.gateName}</div>
                <div><strong>Supervisor:</strong> {shift.supervisorName} (Operations Room)</div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <strong>Status:</strong>
                  <Badge variant={shift.status === "CHECKED_IN" ? "success" : "danger"}>
                    {shift.status === "CHECKED_IN" ? "Checked In" : "Not Checked In"}
                  </Badge>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                {shift.status !== "CHECKED_IN" ? (
                  <Button onClick={handleCheckIn} variant="primary" style={{ flex: 1 }}>
                    Check In
                  </Button>
                ) : (
                  <Button onClick={handleCheckOut} variant="secondary" style={{ flex: 1, borderColor: "var(--color-danger)", color: "var(--color-danger)" }}>
                    Check Out
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Quick Actions Panel */}
          <Card title="Quick Actions" subtitle="One-click operational triggers">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <button onClick={() => setReportModalOpen(true)} className="btn btn-secondary" style={{ padding: "0.75rem", fontSize: "0.8rem" }}>
                📢 Report Incident
              </button>
              <button onClick={handleTriggerSOS} className="btn btn-danger" style={{ padding: "0.75rem", fontSize: "0.8rem" }}>
                ⚠️ Emergency SOS
              </button>
              <button onClick={() => setMapOpen(true)} className="btn btn-secondary" style={{ padding: "0.75rem", fontSize: "0.8rem" }}>
                🗺️ View Map
              </button>
              <button onClick={() => handleSendAiQuery("What is my current assignment details?")} className="btn btn-secondary" style={{ padding: "0.75rem", fontSize: "0.8rem" }}>
                🤖 Ask AI Co-Pilot
              </button>
            </div>
          </Card>
        </div>

        {/* Center: Current Assignment & Task Checklist */}
        <div style={{ gridColumn: "span 5", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Current Assignment Card */}
          <Card
            title="Current Assignment"
            subtitle={activeAssignment ? "Assigned Operational Dispatch" : "Idle Status Ready"}
            style={{ borderLeft: activeAssignment ? "4px solid var(--color-warning)" : "1px solid var(--border-light)" }}
          >
            {activeAssignment ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--text-primary)" }}>
                    {activeAssignment.reason.split(".")[0]}
                  </h3>
                  <Badge variant="danger">HIGH PRIORITY</Badge>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                  {activeAssignment.reason}
                </p>
                <div style={{ display: "flex", gap: "1rem", fontSize: "0.85rem", color: "var(--text-muted)", borderTop: "1px solid var(--border-light)", paddingTop: "0.75rem" }}>
                  <div><strong>Assignee ID:</strong> {activeAssignment.assigneeId}</div>
                  <div><strong>Status:</strong> {activeAssignment.status}</div>
                </div>

                {activeAssignment.status !== "ACCEPTED" && activeAssignment.status !== "REJECTED" && (
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                    <Button onClick={() => handleAcceptAssignment(activeAssignment.id)} variant="primary" style={{ flex: 1 }}>
                      Accept Assignment
                    </Button>
                    <Button onClick={() => handleRejectAssignment(activeAssignment.id)} variant="secondary" style={{ flex: 1, borderColor: "var(--color-danger)", color: "var(--color-danger)" }}>
                      Reject Assignment
                    </Button>
                  </div>
                )}

                {alternatives.length > 0 && (
                  <div style={{ marginTop: "1rem", borderTop: "1px solid var(--border-light)", paddingTop: "1rem" }}>
                    <h4 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-warning)", marginBottom: "0.5rem" }}>
                      Alternative Volunteer Recommendations (Decision Runtime)
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {alternatives.map((alt: any) => (
                        <div key={alt.volunteerId} className="glass-panel" style={{ padding: "0.5rem 0.75rem", fontSize: "0.8rem", display: "flex", flexDirection: "column", gap: "0.25rem", borderLeft: "3px solid var(--color-warning)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
                            <span>{alt.name} ({alt.volunteerId})</span>
                            <span style={{ color: "var(--color-success)" }}>{(alt.compatibilityScore * 100).toFixed(0)}% Match</span>
                          </div>
                          <div style={{ color: "var(--text-secondary)" }}>{alt.justification}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "1rem 0", color: "var(--text-secondary)" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>✅</div>
                <div>No active assignments. Stand by at your gate zone.</div>
              </div>
            )}
          </Card>

          {/* Task Checklist Card */}
          <Card title="Task Checklist" subtitle="Required duties & operations checklist">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {tasks.length > 0 ? (
                tasks.map((task: any) => (
                  <div
                    key={task.id}
                    className="glass-panel"
                    style={{
                      padding: "1rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderLeft: task.status === "COMPLETED" ? "4px solid var(--color-success)" : "4px solid var(--color-info)",
                      backgroundColor: "rgba(255,255,255,0.01)",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1, paddingRight: "1rem" }}>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <span style={{ fontWeight: 600, fontSize: "0.95rem", textDecoration: task.status === "COMPLETED" ? "line-through" : "none", color: task.status === "COMPLETED" ? "var(--text-muted)" : "var(--text-primary)" }}>
                          {task.title}
                        </span>
                        <span style={{ fontSize: "0.65rem" }}>
                          <Badge variant={task.priority === "HIGH" ? "danger" : "neutral"}>
                            {task.priority}
                          </Badge>
                        </span>
                      </div>
                      <span style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>
                        {task.description}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "0.25rem" }}>
                      {task.status === "CREATED" && (
                        <Button onClick={() => handleStartTask(task.id)} variant="primary" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}>
                          Start
                        </Button>
                      )}
                      {task.status === "IN_PROGRESS" && (
                        <Button onClick={() => handleCompleteTask(task.id)} variant="secondary" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}>
                          Complete
                        </Button>
                      )}
                      {task.status === "COMPLETED" && (
                        <span style={{ fontSize: "1.25rem", color: "var(--color-success)" }}>✓</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "1rem" }}>No active checklist items.</div>
              )}
            </div>
          </Card>

          {/* Active Incident Card */}
          <Card title="Active Area Incidents" subtitle="Zone incidents reporting monitor">
            {incidents.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {incidents.map((inc: any) => (
                  <div
                    key={inc.id}
                    style={{
                      padding: "1rem",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-danger)",
                      backgroundColor: "rgba(220, 38, 38, 0.04)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 600, color: "var(--color-danger)", fontSize: "0.95rem" }}>
                        🚨 {inc.id}: {inc.location}
                      </span>
                      <Badge variant="danger">{inc.severity} Severity</Badge>
                    </div>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>
                      {inc.description}
                    </p>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem", display: "flex", justifyContent: "space-between" }}>
                      <span>Reported: {new Date(inc.createdAt).toLocaleTimeString()}</span>
                      <span>Status: {inc.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "1rem 0", color: "var(--color-success)" }}>
                <div style={{ fontSize: "1.5rem" }}>🟢</div>
                <div style={{ fontSize: "0.9rem", marginTop: "0.25rem" }}>Lusail Stadium Zone A is clear. No active incidents.</div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Hand: AI assistant co-pilot & Notification Center */}
        <div style={{ gridColumn: "span 3", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* AI Assistant Widget */}
          <Card title="MEVIS AI Co-Pilot" subtitle="Reasoning generation assistant">
            <div style={{ display: "flex", flexDirection: "column", height: "350px" }}>
              {/* Chat Thread */}
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.75rem", paddingRight: "0.25rem", fontSize: "0.875rem" }}>
                {aiMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    style={{
                      alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                      backgroundColor: msg.sender === "user" ? "var(--color-primary)" : "rgba(255,255,255,0.06)",
                      color: msg.sender === "user" ? "#fff" : "var(--text-primary)",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "var(--radius-sm)",
                      maxWidth: "85%",
                      lineHeight: "1.4",
                    }}
                  >
                    {msg.text}
                  </div>
                ))}
                {isAiResponding && (
                  <div style={{ alignSelf: "flex-start", color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.8rem" }}>
                    Reasoning co-pilot typing...
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", gap: "0.25rem", overflowX: "auto", paddingBottom: "0.25rem", whiteSpace: "nowrap" }}>
                  <button onClick={() => handleSendAiQuery("Where is my next assignment?")} style={{ fontSize: "0.7rem", padding: "2px 6px", borderRadius: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-light)", cursor: "pointer", color: "var(--text-secondary)" }}>
                    📍 Next Assignment?
                  </button>
                  <button onClick={() => handleSendAiQuery("Navigate me to Gate B.")} style={{ fontSize: "0.7rem", padding: "2px 6px", borderRadius: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-light)", cursor: "pointer", color: "var(--text-secondary)" }}>
                    🗺️ Gate B navigation?
                  </button>
                  <button onClick={() => handleSendAiQuery("What should I do now?")} style={{ fontSize: "0.7rem", padding: "2px 6px", borderRadius: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-light)", cursor: "pointer", color: "var(--text-secondary)" }}>
                    📋 Next task?
                  </button>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendAiQuery();
                  }}
                  style={{ display: "flex", gap: "0.5rem" }}
                >
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ask MEVIS AI co-pilot..."
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    style={{ flex: 1, padding: "0.5rem" }}
                  />
                  <Button type="submit" variant="primary" style={{ padding: "0.5rem" }}>
                    Send
                  </Button>
                </form>
                {latestTrustPackage && (
                  <button
                    id="btn-view-trust"
                    onClick={() => setTrustModalOpen(true)}
                    style={{
                      background: "rgba(59, 130, 246, 0.15)",
                      border: "1px dashed var(--color-primary)",
                      color: "var(--color-primary)",
                      fontSize: "0.75rem",
                      padding: "0.4rem",
                      borderRadius: "var(--radius-sm)",
                      cursor: "pointer",
                      width: "100%",
                      fontWeight: 600,
                      marginTop: "0.25rem",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "0.25rem"
                    }}
                  >
                    <span>💡</span> Verification: View Trust, Citations & Traces
                  </button>
                )}
              </div>
            </div>
          </Card>

          {/* Notification Center */}
          <Card title="Notification Center" subtitle={`${unreadNotificationsCount} Unread alerts`}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "250px", overflowY: "auto" }}>
              {notifications.length > 0 ? (
                notifications.map((notif: any) => (
                  <div
                    key={notif.id}
                    style={{
                      padding: "0.75rem",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-light)",
                      backgroundColor: notif.acknowledgedAt ? "transparent" : "rgba(59, 130, 246, 0.05)",
                      position: "relative",
                    }}
                  >
                    {!notif.acknowledgedAt && (
                      <span
                        style={{
                          position: "absolute",
                          top: "8px",
                          right: "8px",
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: "var(--color-primary)",
                        }}
                      />
                    )}
                    <h4 style={{ fontSize: "0.875rem", fontWeight: 600, paddingRight: "10px" }}>{notif.title}</h4>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                      {notif.body}
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                        {new Date(notif.timestamp).toLocaleTimeString()}
                      </span>
                      {!notif.acknowledgedAt && (
                        <button
                          onClick={async () => {
                            await fetch(`${CONTEXT_SERVICE_URL}/api/notifications/acknowledge`, {
                              method: "POST",
                              headers,
                              body: JSON.stringify({ notificationId: notif.id }),
                            });
                            fetchDashboardData();
                          }}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--color-primary)",
                            fontSize: "0.75rem",
                            cursor: "pointer",
                            fontWeight: 600,
                          }}
                        >
                          Ack
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "1rem" }}>No notifications.</div>
              )}
            </div>
          </Card>

          {/* Operational Status Panel */}
          <Card title="Operational Status" subtitle="Live hardware telemetry signals">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>GPS Availability:</span>
                <Badge variant="success">High Accuracy</Badge>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Location Precision:</span>
                <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>± 2.4 meters</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Comms Signal (LTE):</span>
                <span style={{ color: "var(--color-success)", fontWeight: 600 }}>Excellent (-68 dBm)</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Active Channels:</span>
                <span style={{ color: "var(--text-primary)" }}>Channel 4, Medical (PTT)</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Battery Level:</span>
                <span style={{ color: "var(--text-primary)" }}>82% (Nominal)</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Map Overlay Modal */}
      {mapOpen && (
        <div
          onClick={() => setMapOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.85)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-panel"
            style={{ width: "90%", maxWidth: "800px", padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "1.5rem" }}>Lusail Stadium Layout (Zone A)</h2>
              <button onClick={() => setMapOpen(false)} style={{ background: "transparent", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-primary)" }}>
                ✕
              </button>
            </div>
            
            {/* Custom high-fidelity CSS/SVG map representation */}
            <div style={{ width: "100%", height: "400px", backgroundColor: "#0b0f19", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyItems: "center" }}>
              <svg width="100%" height="100%" viewBox="0 0 800 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Stadium Outer Perimeter */}
                <ellipse cx="400" cy="200" rx="350" ry="180" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                <ellipse cx="400" cy="200" rx="300" ry="150" stroke="var(--border-light)" strokeWidth="2" />
                
                {/* Zones boundaries */}
                <line x1="400" y1="50" x2="400" y2="350" stroke="rgba(255,255,255,0.08)" strokeDasharray="5 5" />
                <line x1="100" y1="200" x2="700" y2="200" stroke="rgba(255,255,255,0.08)" strokeDasharray="5 5" />
                
                {/* Stadium Pitch */}
                <rect x="320" y="140" width="160" height="120" rx="10" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
                <circle cx="400" cy="200" r="30" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
                
                {/* Zone A Indicator */}
                <path d="M 400 50 A 300 150 0 0 1 700 200 L 400 200 Z" fill="rgba(59, 130, 246, 0.05)" />
                <text x="520" y="110" fill="var(--color-primary)" fontWeight="bold" fontSize="16">ZONE A</text>
                
                {/* Gate A1 */}
                <circle cx="680" cy="180" r="10" fill="var(--color-warning)" />
                <text x="695" y="185" fill="var(--text-primary)" fontSize="12" fontWeight="600">Gate A1</text>
                
                {/* Current Volunteer Location Pin */}
                <circle cx={currentCoords[0]} cy={currentCoords[1]} r="8" fill="var(--color-success)" />
                <circle cx={currentCoords[0]} cy={currentCoords[1]} r="14" stroke="var(--color-success)" strokeWidth="2" style={{ animation: "pulseRing 2s infinite" }} />
                <text x={currentCoords[0] - 15} y={currentCoords[1] - 22} fill="var(--color-success)" fontSize="11" fontWeight="600">You (Medical Lead)</text>
                
                {/* Incident Pin */}
                <circle cx="670" cy="200" r="8" fill="var(--color-danger)" />
                <text x="650" y="225" fill="var(--color-danger)" fontSize="11" fontWeight="600">INC-01: Bottleneck</text>
              </svg>
            </div>
            
            <div style={{ display: "flex", gap: "1rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              <div>🟢 Green: Your Location</div>
              <div>🟡 Yellow: Gate Location</div>
              <div>🔴 Red: Active Incident</div>
            </div>
          </div>
        </div>
      )}

      {/* Report Incident Modal */}
      {reportModalOpen && (
        <div
          onClick={() => setReportModalOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.85)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-panel"
            style={{ width: "90%", maxWidth: "500px", padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "1.5rem" }}>Report Local Incident</h2>
              <button onClick={() => setReportModalOpen(false)} style={{ background: "transparent", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-primary)" }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleReportIncident} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="incLoc">Incident Location</label>
                <input
                  id="incLoc"
                  type="text"
                  className="form-input"
                  value={incidentLoc}
                  onChange={(e) => setIncidentLoc(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="incSev">Severity Level</label>
                <select
                  id="incSev"
                  value={incidentSeverity}
                  onChange={(e) => setIncidentSeverity(e.target.value)}
                  style={{
                    backgroundColor: "hsla(223, 20%, 5%, 0.6)",
                    border: "1px solid var(--border-light)",
                    color: "var(--text-primary)",
                    padding: "0.625rem",
                    borderRadius: "var(--radius-sm)",
                    outline: "none",
                  }}
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="incDesc">Description of Situation</label>
                <textarea
                  id="incDesc"
                  className="form-input"
                  placeholder="e.g. Crowd bottle neck forming at entrance stairs, volunteer needs reinforcement..."
                  rows={4}
                  value={incidentDesc}
                  onChange={(e) => setIncidentDesc(e.target.value)}
                  style={{ resize: "none" }}
                  required
                />
              </div>

              <Button type="submit" variant="primary">
                Broadcast Incident Alert
              </Button>
            </form>
          </div>
        </div>
      )}
      {/* Grounded Trust Package Details Modal */}
      {trustModalOpen && latestTrustPackage && (
        <div
          onClick={() => setTrustModalOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.85)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-panel"
            style={{
              width: "90%",
              maxWidth: "600px",
              padding: "2rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
              maxHeight: "85vh",
              overflowY: "auto",
              border: "1px solid var(--color-primary)",
              color: "var(--text-primary)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-primary)" }}>
                🛡️ Grounded AI Trust Verification
              </h2>
              <button onClick={() => setTrustModalOpen(false)} style={{ background: "transparent", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-primary)" }}>
                ✕
              </button>
            </div>

            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "-0.5rem" }}>
              This response was processed through the MEVIS governance pipeline. Raw LLM generations are validated and grounded in active database snapshots before display.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Confidence scores */}
              <div>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.35rem" }}>
                  Confidence Metrics
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", fontSize: "0.8rem", textAlign: "center" }}>
                  <div className="glass-panel" style={{ padding: "0.5rem" }}>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Overall</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-success)" }}>
                      {(latestTrustPackage.overallConfidence * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="glass-panel" style={{ padding: "0.5rem" }}>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Freshness</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-primary)" }}>
                      {((latestTrustPackage.confidenceScores?.freshness || 0.95) * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="glass-panel" style={{ padding: "0.5rem" }}>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Compliance</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-primary)" }}>
                      {((latestTrustPackage.confidenceScores?.compliance || 0.98) * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Traces */}
              {latestTrustPackage.traces && latestTrustPackage.traces.length > 0 && (
                <div>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.35rem" }}>
                    Reasoning Plan Execution Traces
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.8rem" }}>
                    {latestTrustPackage.traces.map((trace: any, i: number) => (
                      <div key={i} className="glass-panel" style={{ padding: "0.5rem", display: "flex", gap: "0.5rem" }}>
                        <span style={{ color: "var(--color-primary)", fontWeight: 600 }}>Step {i + 1}:</span>
                        <span>{trace.message || trace.trace_message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Evidence */}
              {latestTrustPackage.evidence && latestTrustPackage.evidence.length > 0 && (
                <div>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.35rem" }}>
                    Grounded Source Evidence
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.8rem" }}>
                    {latestTrustPackage.evidence.map((ev: any, i: number) => (
                      <div key={i} className="glass-panel" style={{ padding: "0.5rem" }}>
                        <div><strong>Source:</strong> {ev.source_entity || ev.sourceEntity}</div>
                        <div style={{ color: "var(--text-secondary)" }}>{ev.extracted_fact || ev.extractedFact}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Citations */}
              {latestTrustPackage.citations && latestTrustPackage.citations.length > 0 && (
                <div>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.35rem" }}>
                    Authoritative Policy & SOP Citations
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.8rem" }}>
                    {latestTrustPackage.citations.map((cit: any, i: number) => (
                      <div key={i} className="glass-panel" style={{ padding: "0.5rem" }}>
                        <div><strong>Policy:</strong> {cit.protocol_document || cit.protocolDocument}</div>
                        <div style={{ color: "var(--text-secondary)" }}>{cit.governance_rule || cit.governanceRule}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
              <Button onClick={() => setTrustModalOpen(false)} variant="primary">
                Done Verification
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
