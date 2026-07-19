import { describe, test, before, after } from "node:test";
import assert from "node:assert";
import http from "node:http";
import { loadServiceConfig } from "@mevis/infrastructure-configuration";
import { bootstrap, server, dbClient } from "../src/index.js";

const serviceConfig = loadServiceConfig("context-service");
const PORT = serviceConfig.port || 3008;

function makeRequest(
  method: string,
  path: string,
  body?: any,
  headers: Record<string, string> = {}
): Promise<{ status: number; payload: any }> {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : "";
    const options: http.RequestOptions = {
      hostname: "localhost",
      port: PORT,
      path,
      method,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
        ...headers,
      },
    };

    const req = http.request(options, res => {
      let data = "";
      res.on("data", chunk => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          resolve({
            status: res.statusCode || 0,
            payload: data ? JSON.parse(data) : null,
          });
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on("error", reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

describe("MEVIS World Model Platform Service E2E Tests", () => {
  before(async () => {
    // Start service
    await bootstrap();
    // Clean database before starting
    await dbClient.execute("DELETE FROM world_relationships;");
    await dbClient.execute("DELETE FROM world_entities;");
    await dbClient.execute("DELETE FROM world_ingested_events;");
    await dbClient.execute("DELETE FROM world_latest_states;");
    await dbClient.execute("DELETE FROM world_state_history;");
    await dbClient.execute("DELETE FROM world_snapshots;");
    await dbClient.execute("DELETE FROM context_packages;");
    await dbClient.execute("DELETE FROM context_situations;");
    await dbClient.execute("DELETE FROM decision_candidates;");
    await dbClient.execute("DELETE FROM decision_analyses;");
    await dbClient.execute("DELETE FROM decision_packages;");
    await dbClient.execute("DELETE FROM trusted_decisions;");
    await dbClient.execute("DELETE FROM decision_runtime_states;");
    await dbClient.execute("DELETE FROM decision_snapshots;");
    await dbClient.execute("DELETE FROM attendance_records;");
    await dbClient.execute("DELETE FROM assignments;");
    await dbClient.execute("DELETE FROM incident_timelines;");
    await dbClient.execute("DELETE FROM tasks;");
    await dbClient.execute("DELETE FROM resource_requests;");
    await dbClient.execute("DELETE FROM incidents;");
    await dbClient.execute("DELETE FROM volunteers;");
    await dbClient.execute("DELETE FROM venue_gates;");
    await dbClient.execute("DELETE FROM venue_zones;");
    await dbClient.execute("DELETE FROM venues;");
    await dbClient.execute("DELETE FROM teams;");
    await dbClient.execute("DELETE FROM resources;");
    await dbClient.execute("DELETE FROM organizations;");

    await dbClient.execute("INSERT INTO organizations (id, name, parent_id, created_at) VALUES ('ORG-01', 'FIFA Operations', NULL, '2026-07-19T00:00:00Z');");
    await dbClient.execute("INSERT INTO venues (id, name, created_at) VALUES ('VENUE-01', 'Lusail Stadium', '2026-07-19T00:00:00Z');");
    await dbClient.execute("INSERT INTO venue_zones (id, venue_id, name) VALUES ('ZONE-01', 'VENUE-01', 'Zone A');");
    await dbClient.execute("INSERT INTO venue_gates (id, venue_id, zone_id, name) VALUES ('GATE-01', 'VENUE-01', 'ZONE-01', 'Gate A1');");
    await dbClient.execute("INSERT INTO teams (id, name, organization_id, capabilities_json, created_at) VALUES ('TEAM-01', 'Medical Responders', 'ORG-01', '[\"MEDICAL\"]', '2026-07-19T00:00:00Z');");
    await dbClient.execute("INSERT INTO resources (id, name, category, serial_number, capabilities_json, created_at) VALUES ('RES-01', 'Ambulance 1', 'VEHICLE', 'SN-001', '[\"TRANSPORT\"]', '2026-07-19T00:00:00Z');");
  });

  after(async () => {
    // Terminate connections and server
    await dbClient.close();
    server.close();
  });

  let venueId: string;
  let gateId: string;
  let checkpointId: string;

  test("1. Verify health status route returns UP", async () => {
    const res = await makeRequest("GET", "/api/health");
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.payload.data.status, "UP");
  });

  test("2. Verify registering Venue entity resolves successfully", async () => {
    const res = await makeRequest(
      "POST",
      "/api/world/entities",
      {
        entityType: "Venue",
        displayName: "Stadium Alpha",
        metadata: { location: "City Center", capacity: 50000 },
      },
      { "x-actor-role": "ROLE_ADMIN" }
    );
    assert.strictEqual(res.status, 201);
    assert.ok(res.payload.data.id.startsWith("world:entity:"));
    venueId = res.payload.data.id;
  });

  test("3. Verify registering Gate entity with Venue as parent resolves hierarchy linkage", async () => {
    const res = await makeRequest(
      "POST",
      "/api/world/entities",
      {
        entityType: "Gate",
        displayName: "Gate A-1",
        parentEntityId: venueId,
        capabilities: ["NFC_SCANNER", "VIP_ACCESS"],
      },
      { "x-actor-role": "ROLE_ADMIN" }
    );
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.payload.data.parentEntityId, venueId);
    gateId = res.payload.data.id;
  });

  test("4. Verify registering Checkpoint entity", async () => {
    const res = await makeRequest(
      "POST",
      "/api/world/entities",
      {
        entityType: "Checkpoint",
        displayName: "Checkpoint East",
        capabilities: ["BAG_CHECK"],
      },
      { "x-actor-role": "ROLE_ADMIN" }
    );
    assert.strictEqual(res.status, 201);
    checkpointId = res.payload.data.id;
  });

  test("5. Verify linking entities via CONNECTED_TO relationships", async () => {
    const res = await makeRequest(
      "POST",
      "/api/world/relationships",
      {
        sourceEntityId: gateId,
        targetEntityId: checkpointId,
        relationshipType: "CONNECTED_TO",
        metadata: { latencyMs: 50 },
      },
      { "x-actor-role": "ROLE_ADMIN" }
    );
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.payload.data.sourceEntityId, gateId);
    assert.strictEqual(res.payload.data.targetEntityId, checkpointId);
    assert.strictEqual(res.payload.data.relationshipType, "CONNECTED_TO");
  });

  test("6. Verify list entities API returns all registered entities", async () => {
    const res = await makeRequest("GET", "/api/world/entities", undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    const list = res.payload.data as any[];
    assert.strictEqual(list.length, 3);
    assert.ok(list.some(e => e.id === venueId));
    assert.ok(list.some(e => e.id === gateId));
  });

  test("7. Verify retrieve single entity API", async () => {
    const res = await makeRequest("GET", `/api/world/entities/${gateId}`, undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    const ent = res.payload.data;
    assert.strictEqual(ent.id, gateId);
    assert.strictEqual(ent.displayName, "Gate A-1");
    assert.deepEqual(ent.capabilities, ["NFC_SCANNER", "VIP_ACCESS"]);
  });

  test("8. Verify hierarchy API maps parent-children tree relationships", async () => {
    const res = await makeRequest("GET", "/api/world/hierarchy", undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    const tree = res.payload.data;
    // gateId must be in children list of venueId
    assert.ok(tree[venueId].includes(gateId));
  });

  test("9. Verify timeline API returns validFrom dates and schedule configurations", async () => {
    const res = await makeRequest("GET", "/api/world/timeline", undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    const timelineList = res.payload.data as any[];
    const entry = timelineList.find(t => t.id === venueId);
    assert.ok(entry);
    assert.ok(entry.timeline.validFrom);
  });

  test("10. Verify manifest API outputs integrityPassed and depth metrics", async () => {
    const res = await makeRequest("GET", "/api/world/manifest", undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    const manifest = res.payload.data;
    assert.strictEqual(manifest.entitiesCreated, 3);
    assert.strictEqual(manifest.relationshipCount, 1);
    assert.strictEqual(manifest.hierarchyDepth, 2); // Venue -> Gate path
    assert.strictEqual(manifest.integrityPassed, true);
  });

  test("11. Verify permissions rejection (world:write requires ROLE_ADMIN)", async () => {
    const res = await makeRequest(
      "POST",
      "/api/world/entities",
      {
        entityType: "Volunteer",
        displayName: "Unauthorized Volunteer",
      },
      { "x-actor-role": "ROLE_USER" } // Non-admin role!
    );
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.payload.errors[0].code, "FORBIDDEN");
  });

  let volunteerId: string;
  const eventId1 = "evt_vol_01";
  const eventId2 = "evt_vol_02";

  test("12. Verify registering Volunteer entity", async () => {
    const res = await makeRequest(
      "POST",
      "/api/world/entities",
      {
        entityType: "Volunteer",
        displayName: "John Doe",
        capabilities: ["MEDICAL"],
      },
      { "x-actor-role": "ROLE_ADMIN" }
    );
    assert.strictEqual(res.status, 201);
    volunteerId = res.payload.data.id;
  });

  test("13. Verify ingesting a valid VolunteerMoved event", async () => {
    const res = await makeRequest(
      "POST",
      "/api/world/events",
      {
        id: eventId1,
        entityId: volunteerId,
        eventType: "VolunteerMoved",
        timestamp: "2026-07-19T09:00:00Z",
        payload: { location: "Zone 1", battery: 85, status: "Active" },
        source: "GPS_DEVICE",
        version: "1.0.0",
      },
      { "x-actor-role": "ROLE_ADMIN" }
    );
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.payload.data.manifest.eventsProcessed, 1);
    assert.strictEqual(res.payload.data.manifest.entitiesUpdated, 1);
  });

  test("14. Verify retrieving latest state for John Doe", async () => {
    const res = await makeRequest("GET", `/api/world/state/${volunteerId}`, undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    const state = res.payload.data;
    assert.strictEqual(state.entityId, volunteerId);
    assert.strictEqual(state.stateData.location, "Zone 1");
    assert.strictEqual(state.stateData.battery, 85);
    assert.strictEqual(state.stateData.status, "Active");
  });

  test("15. Verify duplicate event returns duplicatesIgnored manifest", async () => {
    const res = await makeRequest(
      "POST",
      "/api/world/events",
      {
        id: eventId1, // Duplicate ID!
        entityId: volunteerId,
        eventType: "VolunteerMoved",
        timestamp: "2026-07-19T09:00:00Z",
        payload: { location: "Zone 1", battery: 85, status: "Active" },
        source: "GPS_DEVICE",
        version: "1.0.0",
      },
      { "x-actor-role": "ROLE_ADMIN" }
    );
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.payload.data.manifest.duplicatesIgnored, 1);
  });

  test("16. Verify out-of-order event returns conflictsDetected manifest", async () => {
    const res = await makeRequest(
      "POST",
      "/api/world/events",
      {
        id: eventId2,
        entityId: volunteerId,
        eventType: "VolunteerMoved",
        timestamp: "2026-07-19T08:00:00Z", // Older timestamp than 09:00:00Z!
        payload: { location: "Zone 2", battery: 84 },
        source: "GPS_DEVICE",
        version: "1.0.0",
      },
      { "x-actor-role": "ROLE_ADMIN" }
    );
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.payload.data.manifest.conflictsDetected, 1);

    // Latest state must NOT have changed
    const stateRes = await makeRequest("GET", `/api/world/state/${volunteerId}`, undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(stateRes.payload.data.stateData.location, "Zone 1");
  });

  test("17. Verify history logs capture chronological events history", async () => {
    const res = await makeRequest("GET", `/api/world/history/${volunteerId}`, undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    const historyList = res.payload.data as any[];
    assert.strictEqual(historyList.length, 1); // Only the first valid event recorded in history
    assert.strictEqual(historyList[0].eventId, eventId1);
  });

  test("18. Verify listing and retrieving snapshots", async () => {
    const listRes = await makeRequest("GET", "/api/world/snapshots", undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(listRes.status, 200);
    const list = listRes.payload.data as any[];
    assert.ok(list.length > 0);

    const snapshotId = list[0].id;
    const detailRes = await makeRequest("GET", `/api/world/snapshots/${snapshotId}`, undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(detailRes.status, 200);
    assert.strictEqual(detailRes.payload.data.id, snapshotId);
  });

  test("19. Verify event ingestion fails for non-existent world entity", async () => {
    const res = await makeRequest(
      "POST",
      "/api/world/events",
      {
        id: "evt_dangling",
        entityId: "world:entity:dangling_id",
        eventType: "VolunteerMoved",
        timestamp: "2026-07-19T10:00:00Z",
        payload: { location: "Zone 5" },
      },
      { "x-actor-role": "ROLE_ADMIN" }
    );
    assert.strictEqual(res.status, 500);
  });

  let incidentId: string;

  test("20. Verify registering an Incident Type entity", async () => {
    const res = await makeRequest(
      "POST",
      "/api/world/entities",
      {
        entityType: "Incident Type",
        displayName: "Medical Emergency alpha",
      },
      { "x-actor-role": "ROLE_ADMIN" }
    );
    assert.strictEqual(res.status, 201);
    incidentId = res.payload.data.id;
  });

  test("21. Verify ingesting IncidentCreated event maps location coords", async () => {
    // John Doe coords: we'll update them to [5.0, 5.0]
    await makeRequest(
      "POST",
      "/api/world/events",
      {
        id: "evt_doe_coords",
        entityId: volunteerId,
        eventType: "VolunteerMoved",
        timestamp: "2026-07-19T10:00:00Z",
        payload: { location: "Zone 1", locationCoords: [5.0, 5.0], status: "AVAILABLE" },
      },
      { "x-actor-role": "ROLE_ADMIN" }
    );

    // Incident coords: [6.0, 6.0] (nearby!)
    const res = await makeRequest(
      "POST",
      "/api/world/events",
      {
        id: "evt_inc_01",
        entityId: incidentId,
        eventType: "IncidentCreated",
        timestamp: "2026-07-19T10:00:00Z",
        payload: { title: "Sprained Ankle", severity: "CRITICAL", location: "Zone 1", locationCoords: [6.0, 6.0], status: "ACTIVE", category: "MEDICAL" },
      },
      { "x-actor-role": "ROLE_ADMIN" }
    );
    assert.strictEqual(res.status, 200);
  });

  test("22. Verify Context Package Build assigns highest priority score to critical incident", async () => {
    const res = await makeRequest(
      "POST",
      "/api/context/build",
      { limit: 5 },
      { "x-actor-role": "ROLE_ADMIN" }
    );
    assert.strictEqual(res.status, 200);
    const pkg = res.payload.data.pkg;
    assert.strictEqual(pkg.situationId, res.payload.data.pkg.situationId);
    
    const incFact = pkg.prioritizedFacts.find((f: any) => f.entityId === incidentId);
    assert.ok(incFact);
    assert.strictEqual(incFact.priorityScore, 1.0); // CRITICAL incident should get score 1.0!
  });

  test("23. Verify Context graph API maps nearby responders and capabilities connections", async () => {
    const res = await makeRequest("GET", "/api/context/graph", undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    const graph = res.payload.data;
    
    // Nodes must contain volunteer and incident
    assert.ok(graph.nodes.some((n: any) => n.id === volunteerId));
    assert.ok(graph.nodes.some((n: any) => n.id === incidentId));

    // Edges must represent NEAR relationship
    assert.ok(graph.edges.some((e: any) => e.relationship === "NEAR"));
  });

  test("24. Verify active situations listing API", async () => {
    const res = await makeRequest("GET", "/api/context/situations", undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    const situations = res.payload.data as any[];
    assert.ok(situations.length > 0);
    assert.ok(situations.some(s => s.title === "Sprained Ankle"));
  });

  test("25. Verify context window configuration endpoint", async () => {
    const res = await makeRequest("GET", "/api/context/window", undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.payload.data.defaultLimit, 5);
  });

  let packageId: string;

  test("26. Verify getting latest validated context package evaluates trust and health status", async () => {
    const res = await makeRequest("GET", "/api/context", undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    const body = res.payload.data;
    assert.ok(body.pkg);
    assert.ok(body.health);
    packageId = body.pkg.packageId;
    assert.strictEqual(body.health.status, "TRUSTED");
    assert.ok(body.health.score >= 0.6);
  });

  test("27. Verify validated packages API lists trusted context packages", async () => {
    const res = await makeRequest("GET", "/api/context/validated", undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    const list = res.payload.data as any[];
    assert.ok(list.length > 0);
    assert.ok(list.some(p => p.packageId === packageId && p.healthStatus === "TRUSTED"));
  });

  test("28. Verify quality and confidence endpoints explain scoring factors", async () => {
    const qualityRes = await makeRequest("GET", "/api/context/quality", undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(qualityRes.status, 200);
    assert.ok(qualityRes.payload.data.length > 0);

    const confidenceRes = await makeRequest("GET", "/api/context/confidence", undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(confidenceRes.status, 200);
    assert.ok(confidenceRes.payload.data[0].confidenceScore >= 0.6);
  });

  test("29. Verify manually triggering validation review via POST validate", async () => {
    const res = await makeRequest(
      "POST",
      "/api/context/validate",
      { packageId },
      { "x-actor-role": "ROLE_ADMIN" }
    );
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.payload.data.packageId, packageId);
    assert.strictEqual(res.payload.data.status, "TRUSTED");
  });

  test("30. Verify getting Digital Twin overview triggers projection rebuilding", async () => {
    const res = await makeRequest("GET", "/api/twin", undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    const twin = res.payload.data;
    assert.ok(twin.entities[volunteerId]);
    assert.ok(twin.entities[incidentId]);
    assert.strictEqual(twin.entities[volunteerId].latestState.attributes.status, "AVAILABLE");
    assert.strictEqual(twin.entities[incidentId].latestState.attributes.status, "ACTIVE");
  });

  test("31. Verify GET /api/twin/entities lists active entities", async () => {
    const res = await makeRequest("GET", "/api/twin/entities", undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    const ents = res.payload.data;
    assert.ok(ents[volunteerId]);
  });

  test("32. Verify GET /api/twin/entities/:id retrieves single active entity", async () => {
    const res = await makeRequest("GET", `/api/twin/entities/${volunteerId}`, undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.payload.data.displayName, "John Doe");
  });

  test("33. Verify querying nearest medical volunteers via Euclidean distance query", async () => {
    const res = await makeRequest("GET", "/api/twin/query/nearest-volunteers?lat=5.1&lng=5.1&limit=2", undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    const list = res.payload.data as any[];
    assert.ok(list.length > 0);
    assert.strictEqual(list[0].id, volunteerId);
    assert.ok(list[0].distance < 0.2); // [5.0, 5.0] vs [5.1, 5.1]
  });

  test("34. Verify querying current active incidents", async () => {
    const res = await makeRequest("GET", "/api/twin/query/incidents", undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    const list = res.payload.data as any[];
    assert.ok(list.length > 0);
    assert.strictEqual(list[0].id, incidentId);
    assert.strictEqual(list[0].severity, "CRITICAL");
  });

  let twinSnapshotId: string;

  test("35. Verify manually committing a Digital Twin snapshot manifest", async () => {
    const res = await makeRequest("GET", "/api/twin/snapshots", undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    assert.ok(res.payload.data.snapshotId);
    twinSnapshotId = res.payload.data.snapshotId;
  });

  test("36. Verify historical playback playbackService reconstructs past operational state", async () => {
    const res = await makeRequest(
      "POST",
      "/api/twin/playback/replay",
      { snapshotId: twinSnapshotId },
      { "x-actor-role": "ROLE_ADMIN" }
    );
    assert.strictEqual(res.status, 200);
    assert.ok(res.payload.data.entities[volunteerId]);
    assert.strictEqual(res.payload.data.entities[volunteerId].displayName, "John Doe");
  });

  let decisionId: string;

  test("37. Verify manually compiling Decision Candidates from Digital Twin state", async () => {
    const res = await makeRequest("POST", "/api/decisions/build", undefined, { "x-actor-role": "ROLE_ADMIN" });
    assert.strictEqual(res.status, 200);
    const list = res.payload.data as any[];
    assert.ok(list.length > 0);
    assert.strictEqual(list[0].decisionType, "Medical Response");
    decisionId = list[0].id;
  });

  test("38. Verify GET /api/decisions lists registered Decision Candidates", async () => {
    const res = await makeRequest("GET", "/api/decisions", undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    const list = res.payload.data as any[];
    assert.ok(list.length > 0);
    assert.ok(list.some(d => d.id === decisionId));
  });

  test("39. Verify GET /api/decisions/:id retrieves single candidate with attached constraints", async () => {
    const res = await makeRequest("GET", `/api/decisions/${decisionId}`, undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    const dec = res.payload.data;
    assert.strictEqual(dec.decisionType, "Medical Response");
    assert.strictEqual(dec.lifecycleState, "Ready For Reasoning");
    assert.ok(dec.constraints.resource.length > 0);
    assert.ok(dec.manifest);
  });

  test("40. Verify GET /api/decisions/types returns list of categories", async () => {
    const res = await makeRequest("GET", "/api/decisions/types", undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    assert.ok(res.payload.data.includes("Medical Response"));
  });

  test("41. Verify GET /api/decisions/registry returning total decisions count", async () => {
    const res = await makeRequest("GET", "/api/decisions/registry", undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    assert.ok(res.payload.data.totalRegisteredDecisions >= 1);
  });

  test("42. Verify GET /api/decisions/manifests retrieving manifest history", async () => {
    const res = await makeRequest("GET", "/api/decisions/manifests", undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    const list = res.payload.data as any[];
    assert.ok(list.length > 0);
    assert.strictEqual(list[0].decisionId, decisionId);
  });

  let analysisId: string;

  test("43. Verify POST /api/reasoning/analyze performs analysis pipeline", async () => {
    const res = await makeRequest(
      "POST",
      "/api/reasoning/analyze",
      { decisionId },
      { "x-actor-role": "ROLE_ADMIN" }
    );
    assert.strictEqual(res.status, 200);
    const anal = res.payload.data;
    assert.strictEqual(anal.decisionId, decisionId);
    assert.ok(anal.trace);
    assert.ok(anal.trace.evidenceUsed.length > 0);
    assert.ok(anal.trace.policiesReferenced.length > 0);
    assert.ok(anal.risks.length > 0);
    analysisId = anal.id;
  });

  test("44. Verify GET /api/reasoning lists completed Decision Analyses", async () => {
    const res = await makeRequest("GET", "/api/reasoning", undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    const list = res.payload.data as any[];
    assert.ok(list.length > 0);
    assert.ok(list.some(a => a.id === analysisId));
  });

  test("45. Verify GET /api/reasoning/:id retrieves single Decision Analysis details", async () => {
    const res = await makeRequest("GET", `/api/reasoning/${analysisId}`, undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    const anal = res.payload.data;
    assert.strictEqual(anal.decisionId, decisionId);
    assert.strictEqual(anal.provenance, `ReasoningEngine:${decisionId}`);
  });

  test("46. Verify GET /api/reasoning/traces retrieves explainable traces", async () => {
    const res = await makeRequest("GET", "/api/reasoning/traces", undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    const list = res.payload.data as any[];
    assert.ok(list.length > 0);
    assert.ok(list[0].evidenceUsed);
  });

  test("47. Verify GET /api/reasoning/risks retrieves evaluated risk list", async () => {
    const res = await makeRequest("GET", "/api/reasoning/risks", undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    const list = res.payload.data as any[];
    assert.ok(list.length > 0);
    assert.ok(list[0].description);
  });

  test("48. Verify GET /api/reasoning/evidence retrieves collected evidence list", async () => {
    const res = await makeRequest("GET", "/api/reasoning/evidence", undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    const list = res.payload.data as any[];
    assert.ok(list.length > 0);
    assert.ok(list[0].title);
  });

  test("49. Verify GET /api/reasoning/policies retrieves loaded policies list", async () => {
    const res = await makeRequest("GET", "/api/reasoning/policies", undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    const list = res.payload.data as any[];
    assert.ok(list.length > 0);
    assert.ok(list[0].content);
  });

  let decisionPackageId: string;

  test("50. Verify POST /api/recommendations/generate compiles ranked alternatives package", async () => {
    const res = await makeRequest(
      "POST",
      "/api/recommendations/generate",
      { analysisId },
      { "x-actor-role": "ROLE_ADMIN" }
    );
    assert.strictEqual(res.status, 200);
    const pkg = res.payload.data;
    assert.strictEqual(pkg.decisionId, decisionId);
    assert.ok(pkg.primaryRecommendation);
    assert.ok(pkg.rankedAlternatives.length > 0);
    assert.ok(pkg.tradeoffs.length > 0);
    decisionPackageId = pkg.id;
  });

  test("51. Verify GET /api/recommendations lists compiled Decision Packages", async () => {
    const res = await makeRequest("GET", "/api/recommendations", undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    const list = res.payload.data as any[];
    assert.ok(list.length > 0);
    assert.ok(list.some(p => p.id === decisionPackageId));
  });

  test("52. Verify GET /api/recommendations/:id retrieves single Decision Package details", async () => {
    const res = await makeRequest("GET", `/api/recommendations/${decisionPackageId}`, undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    const pkg = res.payload.data;
    assert.strictEqual(pkg.decisionId, decisionId);
    assert.strictEqual(pkg.provenance, `RecommendationEngine:${analysisId}`);
  });

  test("53. Verify GET /api/recommendations/alternatives retrieves alternatives list", async () => {
    const res = await makeRequest("GET", "/api/recommendations/alternatives", undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    const list = res.payload.data as any[];
    assert.ok(list.length > 0);
    assert.ok(list[0].description);
  });

  test("54. Verify GET /api/recommendations/priority retrieves hierarchical priority list", async () => {
    const res = await makeRequest("GET", "/api/recommendations/priority", undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    const list = res.payload.data as any[];
    assert.ok(list.length > 0);
    assert.ok(list[0].primary);
  });

  test("55. Verify GET /api/recommendations/tradeoffs retrieves tradeoffs list", async () => {
    const res = await makeRequest("GET", "/api/recommendations/tradeoffs", undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    const list = res.payload.data as any[];
    assert.ok(list.length > 0);
    assert.ok(list[0].compromise);
  });

  test("56. Verify GET /api/decision-packages retrieves packages list overview", async () => {
    const res = await makeRequest("GET", "/api/decision-packages", undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    const list = res.payload.data as any[];
    assert.ok(list.length > 0);
    assert.strictEqual(list[0].id, decisionPackageId);
  });

  let trustedDecisionId: string;

  test("57. Verify POST /api/governance/validate performs validation checks", async () => {
    const res = await makeRequest(
      "POST",
      "/api/governance/validate",
      { packageId: decisionPackageId },
      { "x-actor-role": "ROLE_ADMIN" }
    );
    assert.strictEqual(res.status, 200);
    const td = res.payload.data;
    assert.strictEqual(td.decisionPackageId, decisionPackageId);
    assert.ok(td.policyCompliance);
    assert.ok(td.safetyStatus);
    assert.ok(td.confidenceScore > 0);
    trustedDecisionId = td.id;
  });

  test("58. Verify GET /api/governance lists compiled Trusted Decisions", async () => {
    const res = await makeRequest("GET", "/api/governance", undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    const list = res.payload.data as any[];
    assert.ok(list.length > 0);
    assert.ok(list.some(d => d.id === trustedDecisionId));
  });

  test("59. Verify GET /api/governance/:id retrieves single Trusted Decision details", async () => {
    const res = await makeRequest("GET", `/api/governance/${trustedDecisionId}`, undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    const td = res.payload.data;
    assert.strictEqual(td.decisionPackageId, decisionPackageId);
    assert.ok(td.approvalRoute.includes("Medical Commander"));
  });

  test("60. Verify GET /api/governance/conflicts retrieves conflicts log", async () => {
    const res = await makeRequest("GET", "/api/governance/conflicts", undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    const list = res.payload.data as any[];
    assert.ok(Array.isArray(list));
  });

  test("61. Verify GET /api/governance/confidence retrieves confidence scores", async () => {
    const res = await makeRequest("GET", "/api/governance/confidence", undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    const list = res.payload.data as any[];
    assert.ok(list.length > 0);
    assert.ok(list[0].confidenceScore);
  });

  test("62. Verify GET /api/governance/approval retrieves approval routes list", async () => {
    const res = await makeRequest("GET", "/api/governance/approval", undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    const list = res.payload.data as any[];
    assert.ok(list.length > 0);
    assert.ok(list[0].approvalRoute);
  });

  test("63. Verify GET /api/trusted-decisions retrieves trusted decisions alias overview", async () => {
    const res = await makeRequest("GET", "/api/trusted-decisions", undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    const list = res.payload.data as any[];
    assert.ok(list.length > 0);
    assert.strictEqual(list[0].id, trustedDecisionId);
  });

  test("64. Verify GET /api/decisions lists authoritative decision states", async () => {
    const res = await makeRequest("GET", "/api/decisions", undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    const list = res.payload.data as any[];
    assert.ok(list.length > 0);
    assert.ok(list.some(d => d.id === trustedDecisionId));
  });

  test("65. Verify GET /api/decisions/pending lists PENDING_APPROVAL decisions", async () => {
    const res = await makeRequest("GET", "/api/decisions/pending", undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    const list = res.payload.data as any[];
    assert.ok(list.length > 0);
    assert.strictEqual(list[0].id, trustedDecisionId);
  });

  test("66. Verify POST /api/decisions/:id/approve transitions state to APPROVED", async () => {
    const res = await makeRequest(
      "POST",
      `/api/decisions/${trustedDecisionId}/approve`,
      { approver: "Medical Commander Alpha" },
      { "x-actor-role": "ROLE_ADMIN" }
    );
    assert.strictEqual(res.status, 200);
    const state = res.payload.data;
    assert.strictEqual(state.lifecycleState, "APPROVED");
    assert.strictEqual(state.approver, "Medical Commander Alpha");
  });

  test("67. Verify GET /api/decisions/approved lists approved decisions", async () => {
    const res = await makeRequest("GET", "/api/decisions/approved", undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    const list = res.payload.data as any[];
    assert.ok(list.length > 0);
    assert.strictEqual(list[0].id, trustedDecisionId);
  });

  test("68. Verify GET /api/decisions/history retrieves logs", async () => {
    const res = await makeRequest("GET", "/api/decisions/history", undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    const list = res.payload.data as any[];
    assert.ok(list.length > 0);
    assert.strictEqual(list[0].decisionId, trustedDecisionId);
  });

  test("69. Verify GET /api/decisions/timeline retrieves sequences", async () => {
    const res = await makeRequest("GET", "/api/decisions/timeline", undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    const list = res.payload.data as any[];
    assert.ok(list.length > 0);
  });

  test("70. Verify GET /api/decisions/playback replays timeline logs", async () => {
    const res = await makeRequest("GET", `/api/decisions/playback?decisionId=${trustedDecisionId}`, undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    const list = res.payload.data as any[];
    assert.ok(list.length > 0);
  });

  let masterVolunteerId: string;

  test("71. Verify POST /api/volunteers registers a new volunteer", async () => {
    const res = await makeRequest(
      "POST",
      "/api/volunteers",
      {
        name: "Carlos Santana",
        email: "carlos@fifa.org",
        organizationId: "ORG-01",
        teamId: "TEAM-01",
        certifications: ["FIRST_AID", "MEDICAL"],
        languages: ["Spanish", "English"],
      },
      { "x-actor-role": "ROLE_ADMIN" }
    );
    assert.strictEqual(res.status, 200);
    const vol = res.payload.data;
    assert.ok(vol.id.startsWith("VOL-"));
    assert.strictEqual(vol.name, "Carlos Santana");
    masterVolunteerId = vol.id;
  });

  test("72. Verify POST /api/volunteers with duplicate email throws validation error", async () => {
    const res = await makeRequest(
      "POST",
      "/api/volunteers",
      {
        name: "Carlos Replica",
        email: "carlos@fifa.org",
        organizationId: "ORG-01",
      },
      { "x-actor-role": "ROLE_ADMIN" }
    );
    assert.strictEqual(res.status, 500); // Unique constraint violation is translated as server error
  });

  test("73. Verify PUT /api/volunteers/:id updates profile parameters", async () => {
    const res = await makeRequest(
      "PUT",
      `/api/volunteers/${masterVolunteerId}`,
      {
        name: "Carlos Santana Junior",
        languages: ["Spanish", "Portuguese"],
      },
      { "x-actor-role": "ROLE_ADMIN" }
    );
    assert.strictEqual(res.status, 200);
    const vol = res.payload.data;
    assert.strictEqual(vol.name, "Carlos Santana Junior");
    assert.ok(vol.languages.includes("Portuguese"));
  });

  test("74. Verify GET /api/volunteers lists master volunteers", async () => {
    const res = await makeRequest("GET", "/api/volunteers", undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    const list = res.payload.data as any[];
    assert.ok(list.length > 0);
    assert.ok(list.some(v => v.id === masterVolunteerId));
  });

  test("75. Verify GET /api/assets/search retrieves query filters", async () => {
    const res = await makeRequest("GET", `/api/assets/search?language=Portuguese`, undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    const list = res.payload.data as any[];
    assert.ok(list.length > 0);
    assert.strictEqual(list[0].id, masterVolunteerId);
  });

  test("76. Verify GET endpoints retrieve master databases for venues, resources, teams, and organizations", async () => {
    const resVenues = await makeRequest("GET", "/api/venues", undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(resVenues.status, 200);
    assert.ok(resVenues.payload.data.length > 0);

    const resResources = await makeRequest("GET", "/api/resources", undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(resResources.status, 200);
    assert.ok(resResources.payload.data.length > 0);

    const resTeams = await makeRequest("GET", "/api/teams", undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(resTeams.status, 200);
    assert.ok(resTeams.payload.data.length > 0);

    const resOrganizations = await makeRequest("GET", "/api/organizations", undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(resOrganizations.status, 200);
    assert.ok(resOrganizations.payload.data.length > 0);
  });

  let testIncidentId: string;
  let testAssignmentId: string;

  test("77. Verify POST /api/incidents creates a new incident", async () => {
    const res = await makeRequest(
      "POST",
      "/api/incidents",
      {
        severity: "CRITICAL",
        location: "Gate 4 Entrance",
        description: "Spectator collapsed, unconscious but breathing.",
      },
      { "x-actor-role": "ROLE_ADMIN" }
    );
    assert.strictEqual(res.status, 200);
    const inc = res.payload.data;
    assert.ok(inc.id.startsWith("INC-"));
    assert.strictEqual(inc.status, "CREATED");
    testIncidentId = inc.id;
  });

  test("78. Verify PUT /api/incidents/:id transitions incident status", async () => {
    const res = await makeRequest(
      "PUT",
      `/api/incidents/${testIncidentId}`,
      { status: "ACKNOWLEDGED" },
      { "x-actor-role": "ROLE_ADMIN" }
    );
    assert.strictEqual(res.status, 200);
    const inc = res.payload.data;
    assert.strictEqual(inc.status, "ACKNOWLEDGED");
  });

  test("79. Verify GET /api/incidents/:id retrieves details and timeline entries", async () => {
    const res = await makeRequest("GET", `/api/incidents/${testIncidentId}`, undefined, { "x-actor-role": "ROLE_USER" });
    assert.strictEqual(res.status, 200);
    const inc = res.payload.data;
    assert.strictEqual(inc.id, testIncidentId);
    assert.ok(inc.timeline.length > 0);
  });

  test("80. Verify POST /api/assignments creates a volunteer assignment", async () => {
    const res = await makeRequest(
      "POST",
      "/api/assignments",
      {
        assigneeId: masterVolunteerId,
        targetId: testIncidentId,
        reason: "Dispatching volunteer to Gates entrance.",
      },
      { "x-actor-role": "ROLE_ADMIN" }
    );
    assert.strictEqual(res.status, 200);
    const asn = res.payload.data;
    assert.ok(asn.id.startsWith("ASN-"));
    testAssignmentId = asn.id;
  });

  test("81. Verify POST /api/assignments fails under exclusivity constraints", async () => {
    const res = await makeRequest(
      "POST",
      "/api/assignments",
      {
        assigneeId: masterVolunteerId,
        targetId: "INC-OTHER",
        reason: "Overlapping request.",
      },
      { "x-actor-role": "ROLE_ADMIN" }
    );
    assert.strictEqual(res.status, 500);
  });

  test("82. Verify POST /api/tasks creates a task", async () => {
    const res = await makeRequest(
      "POST",
      "/api/tasks",
      {
        title: "Spectator Guidance",
        description: "Direct arriving spectators to Gate 4 seats.",
        priority: "HIGH",
      },
      { "x-actor-role": "ROLE_ADMIN" }
    );
    assert.strictEqual(res.status, 200);
    const t = res.payload.data;
    assert.ok(t.id.startsWith("TSK-"));
  });

  test("83. Verify POST /api/resource-requests checkout allocation logs", async () => {
    const res = await makeRequest(
      "POST",
      "/api/resource-requests",
      {
        resourceId: "RES-01",
        requester: "Lead Medic Coordinator",
      },
      { "x-actor-role": "ROLE_ADMIN" }
    );
    assert.strictEqual(res.status, 200);
    const reqObj = res.payload.data;
    assert.ok(reqObj.id.startsWith("REQ-"));
  });

  test("84. Verify POST /api/attendance/check-in checks in a volunteer", async () => {
    const res = await makeRequest(
      "POST",
      "/api/attendance/check-in",
      { volunteerId: masterVolunteerId },
      { "x-actor-role": "ROLE_ADMIN" }
    );
    assert.strictEqual(res.status, 200);
    const record = res.payload.data;
    assert.strictEqual(record.status, "CHECKED_IN");
  });

  test("85. Verify duplicate check-in fails validation", async () => {
    const res = await makeRequest(
      "POST",
      "/api/attendance/check-in",
      { volunteerId: masterVolunteerId },
      { "x-actor-role": "ROLE_ADMIN" }
    );
    assert.strictEqual(res.status, 500);
  });

  test("86. Verify POST /api/attendance/check-out checks out volunteer", async () => {
    const res = await makeRequest(
      "POST",
      "/api/attendance/check-out",
      { volunteerId: masterVolunteerId },
      { "x-actor-role": "ROLE_ADMIN" }
    );
    assert.strictEqual(res.status, 200);
    const record = res.payload.data;
    assert.strictEqual(record.status, "CHECKED_OUT");
  });

  test("87. Verify check-out without checking in fails validation", async () => {
    const res = await makeRequest(
      "POST",
      "/api/attendance/check-out",
      { volunteerId: masterVolunteerId },
      { "x-actor-role": "ROLE_ADMIN" }
    );
    assert.strictEqual(res.status, 500);
  });
});
