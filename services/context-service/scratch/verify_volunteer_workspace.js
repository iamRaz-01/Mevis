const http = require("http");

const BASE_URL = "http://localhost:3008";
const VOLUNTEER_ID = "VOL-alternate-01"; // Alternate volunteer from the test database seeds
const INCIDENT_ID = "INC-48291426";      // Master incident ID from the seeds

const headers = {
  "Content-Type": "application/json",
  "x-actor-role": "ROLE_VOLUNTEER",
  "x-volunteer-id": VOLUNTEER_ID,
  "x-actor-id": VOLUNTEER_ID,
};

const adminHeaders = {
  "Content-Type": "application/json",
  "x-actor-role": "ROLE_ADMIN",
  "x-actor-id": "u-admin",
};

function makeRequest(method, path, body = null, useAdmin = false) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      method: method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: useAdmin ? adminHeaders : headers,
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json,
        });
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  console.log("=== VOLUNTEER WORKSPACE & EXPERIENCE RUNTIME INTEGRATION VERIFICATION ===");

  // 1. Check in volunteer
  console.log("\n1. Testing Volunteer Check-in...");
  const checkinRes = await makeRequest("POST", "/api/volunteer/checkin");
  console.log(`Status: ${checkinRes.status}`);
  if (checkinRes.status !== 200 || !checkinRes.data.success) {
    throw new Error("Volunteer checkin failed: " + JSON.stringify(checkinRes.data));
  }
  console.log("  [OK] Volunteer successfully checked in.");

  // 2. Fetch Dashboard
  console.log("\n2. Testing GET /api/volunteer/dashboard...");
  const dashRes = await makeRequest("GET", "/api/volunteer/dashboard");
  console.log(`Status: ${dashRes.status}`);
  if (dashRes.status !== 200 || !dashRes.data.success) {
    throw new Error("Fetch dashboard failed: " + JSON.stringify(dashRes.data));
  }
  const dash = dashRes.data.data;
  console.log(`  [OK] Dashboard loaded profile name: ${dash.profile.name}`);
  console.log(`  [OK] Shift Status: ${dash.shift.status}`);
  console.log(`  [OK] Shift Location: ${dash.shift.venueName} - ${dash.shift.zoneName}`);
  console.log(`  [OK] Tasks count: ${dash.tasks.length}`);
  console.log(`  [OK] Notifications count: ${dash.notifications.length}`);

  // 3. Update Location
  console.log("\n3. Testing GPS Geolocation Simulation update...");
  const locRes = await makeRequest("POST", "/api/volunteer/location", {
    location: "Zone A, Gate A1 Corridor Entrance",
    locationCoords: [635.4, 155.8],
  });
  console.log(`Status: ${locRes.status}`);
  if (locRes.status !== 200 || !locRes.data.success) {
    throw new Error("Location update failed: " + JSON.stringify(locRes.data));
  }
  console.log("  [OK] Geolocation coordinates update processed successfully.");

  // 4. Create and transition assignment
  console.log("\n4. Testing Assignment Dispatch creation and Acceptance flow...");
  // Create an assignment via Admin
  const createAsnRes = await makeRequest("POST", "/api/assignments", {
    assigneeId: VOLUNTEER_ID,
    targetId: INCIDENT_ID,
    reason: "Verification dispatch for volunteer workstation check.",
  }, true);
  console.log(`Create Assignment Status: ${createAsnRes.status}`);
  if (createAsnRes.status !== 200 || !createAsnRes.data.success) {
    throw new Error("Admin assignment creation failed: " + JSON.stringify(createAsnRes.data));
  }
  const assignmentId = createAsnRes.data.data.id;
  console.log(`  [OK] Assignment created successfully with ID: ${assignmentId}`);

  // Accept the assignment
  const acceptAsnRes = await makeRequest("POST", `/api/volunteer/assignments/${assignmentId}/accept`);
  console.log(`Accept Assignment Status: ${acceptAsnRes.status}`);
  if (acceptAsnRes.status !== 200 || !acceptAsnRes.data.success) {
    throw new Error("Volunteer assignment acceptance failed: " + JSON.stringify(acceptAsnRes.data));
  }
  console.log("  [OK] Assignment accepted successfully.");

  // 5. Test Reject Assignment with recommendations
  console.log("\n5. Testing Assignment Rejection and Alternative Recommendations...");
  // Reject the assignment (which will recommend alternatives because the incident needs to be resolved)
  const rejectAsnRes = await makeRequest("POST", `/api/volunteer/assignments/${assignmentId}/reject`);
  console.log(`Reject Assignment Status: ${rejectAsnRes.status}`);
  if (rejectAsnRes.status !== 200 || !rejectAsnRes.data.success) {
    throw new Error("Volunteer assignment rejection failed: " + JSON.stringify(rejectAsnRes.data));
  }
  const body = rejectAsnRes.data;
  console.log(`  [OK] Assignment rejected successfully.`);
  if (body.alternativeRecommendations && body.alternativeRecommendations.length > 0) {
    console.log(`  [OK] Alternative volunteer recommendations found: ${body.alternativeRecommendations.length}`);
    body.alternativeRecommendations.forEach((alt) => {
      console.log(`    - Candidate: ${alt.name} (${alt.volunteerId}), Match Score: ${(alt.compatibilityScore * 100).toFixed(0)}%, Justification: ${alt.justification}`);
    });
  } else {
    throw new Error("No alternative recommendations returned for the rejected assignment!");
  }

  // 6. Test Task state transitions
  console.log("\n6. Testing Task checklist transition (CREATED -> IN_PROGRESS -> COMPLETED)...");
  // Find a task in the dashboard
  const freshDashRes = await makeRequest("GET", "/api/volunteer/dashboard");
  const tasks = freshDashRes.data.data.tasks;
  if (tasks.length === 0) {
    console.log("  [WARN] No tasks found in dashboard to transition.");
  } else {
    const task = tasks[0];
    console.log(`  Found task: ${task.title} (ID: ${task.id}, Status: ${task.status})`);
    
    // Start task
    const startTaskRes = await makeRequest("POST", `/api/volunteer/tasks/${task.id}/start`);
    console.log(`  Start Task Status: ${startTaskRes.status}`);
    if (startTaskRes.status !== 200 || !startTaskRes.data.success) {
      throw new Error("Start task failed: " + JSON.stringify(startTaskRes.data));
    }
    console.log("    [OK] Task transitioned to IN_PROGRESS.");

    // Complete task
    const completeTaskRes = await makeRequest("POST", `/api/volunteer/tasks/${task.id}/complete`);
    console.log(`  Complete Task Status: ${completeTaskRes.status}`);
    if (completeTaskRes.status !== 200 || !completeTaskRes.data.success) {
      throw new Error("Complete task failed: " + JSON.stringify(completeTaskRes.data));
    }
    console.log("    [OK] Task transitioned to COMPLETED.");
  }

  // 7. Testing Critical Emergency SOS
  console.log("\n7. Testing Emergency SOS alert broadcast...");
  const sosRes = await makeRequest("POST", "/api/volunteer/sos", {
    reason: "Volunteer heat exhaustion near Entrance Tunnel B",
    location: "Entrance Tunnel B",
  });
  console.log(`SOS Status: ${sosRes.status}`);
  if (sosRes.status !== 200 || !sosRes.data.success) {
    throw new Error("Emergency SOS broadcast failed: " + JSON.stringify(sosRes.data));
  }
  console.log("  [OK] Critical Emergency SOS broadcasted and critical incident raised.");

  // 8. Testing AI Co-Pilot Chat and Grounded Trust Package
  console.log("\n8. Testing AI Co-Pilot chat with Grounded Trust Package audit...");
  const chatRes = await makeRequest("POST", "/runtime/ai/v1/chat", {
    message: "Who is the supervisor for my shift, and is there any active incident in my zone?",
  });
  console.log(`Chat Status: ${chatRes.status}`);
  if (chatRes.status !== 200 || !chatRes.data.success) {
    throw new Error("AI Co-pilot chat failed: " + JSON.stringify(chatRes.data));
  }
  const chatData = chatRes.data.data;
  console.log(`  [OK] Generated Text response: "${chatData.generatedText}"`);
  
  if (chatData.trustPackage) {
    const tp = chatData.trustPackage;
    console.log(`  [OK] Grounded Trust Package audit verification successful.`);
    console.log(`    - Trust ID: ${tp.id}`);
    console.log(`    - Overall Confidence: ${(tp.overallConfidence * 100).toFixed(0)}%`);
    console.log(`    - Confidence Scores: Freshness ${((tp.confidenceScores?.freshness || 0) * 100).toFixed(0)}%, Compliance ${((tp.confidenceScores?.compliance || 0) * 100).toFixed(0)}%`);
    console.log(`    - Traces Count: ${tp.traces?.length}`);
    tp.traces?.forEach((t, i) => console.log(`      * Trace step ${i + 1}: ${t.trace_message || t.message}`));
    console.log(`    - Evidence Count: ${tp.evidence?.length}`);
    tp.evidence?.forEach((ev) => console.log(`      * Fact: "${ev.extracted_fact || ev.extractedFact}" (Source: ${ev.source_entity || ev.sourceEntity})`));
    console.log(`    - Citations Count: ${tp.citations?.length}`);
    tp.citations?.forEach((cit) => console.log(`      * Citation: "${cit.governance_rule || cit.governanceRule}" (Document: ${cit.protocol_document || cit.protocolDocument})`));
  } else {
    throw new Error("AI chat response does not contain trustPackage metadata package!");
  }

  console.log("\n========================================================================");
  console.log("SUCCESS: All volunteer operations and AI experience runtime verification checks passed successfully!");
  console.log("========================================================================");
}

run().catch((err) => {
  console.error("\n❌ VERIFICATION FAILED:");
  console.error(err);
  process.exit(1);
});
