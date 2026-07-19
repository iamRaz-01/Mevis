import os

DEC_INT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../decision-intelligence"))
os.makedirs(DEC_INT_DIR, exist_ok=True)

def write_spec(filename, content):
    filepath = os.path.join(DEC_INT_DIR, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")
    print(f"Generated {filename}")

# 1. Decision Taxonomy
write_spec("decision-taxonomy.md", """
# Decision Taxonomy Specification

This document defines the formal taxonomy of operational decisions within the MEVIS platform.

---

## 1. Decision Categories

### 1.1 Navigation Decisions
*   **Purpose**: Optimize routing patterns for volunteers, equipment, and crowd flows.
*   **Required Context**: Live location telemetry, active gate statuses, zone occupancy.
*   **Required Evidence**: Ground-truth route blockage alerts, structural map data.
*   **Applicable Policies**: Stadium structural constraints, pedestrian flow limits.
*   **Risk Level**: LOW to MEDIUM.
*   **Human Approval**: Autonomous recommendation; no supervisor sign-off required for standard volunteer routing.

### 1.2 Medical Decisions
*   **Purpose**: Resolve patient triaging, paramedic dispatches, and ambulance escalations.
*   **Required Context**: Patient vitals/symptoms description, location, nearby medical assets.
*   **Required Evidence**: Paramedic location telemetry, START Triage guidelines.
*   **Applicable Policies**: Medical response SLAs, HIPAA/privacy guidelines.
*   **Risk Level**: HIGH to CRITICAL.
*   **Human Approval**: MUST be reviewed and approved by a Supervisor or Coordinator.

### 1.3 Security Decisions
*   **Purpose**: Mitigate access violations, suspicious activity reports, or perimeter intrusions.
*   **Required Context**: Sensor logs, CCTV camera detection status, volunteer field observations.
*   **Required Evidence**: Matching credential logs, photo/video feeds.
*   **Applicable Policies**: Security perimeter rules, local law enforcement escalation protocols.
*   **Risk Level**: HIGH to CRITICAL.
*   **Human Approval**: LOCK/Evacuate command actions MUST be cleared by the Coordinator.

### 1.4 Accessibility Decisions
*   **Purpose**: Maintain ADA compliance, direct wheelchair support, and bypass elevator failures.
*   **Required Context**: Accessible route status, elevator telemetry, volunteer positions.
*   **Required Evidence**: Elevator offline event alerts, wheelchair asset availability logs.
*   **Applicable Policies**: ADA compliance regulations, stadium inclusion mandates.
*   **Risk Level**: LOW.
*   **Human Approval**: Auto-dispatched to the nearest active volunteer.

### 1.5 Volunteer Decisions
*   **Purpose**: Coordinate shift rosters, break times, workload balancing, and fatigue prevention.
*   **Required Context**: Check-in status, total shift hours worked, current active task list.
*   **Required Evidence**: Shift scheduler tables, task completion rates.
*   **Applicable Policies**: Labor rules, shift maximum break thresholds.
*   **Risk Level**: LOW.
*   **Human Approval**: Break recommendations suggested to Volunteer; auto-approved on click.

### 1.6 Transport Decisions
*   **Purpose**: Direct spectator shuttle buses, resolve parking overflow, and flag route delays.
*   **Required Context**: Shuttle arrival times, parking capacity indicators, local traffic API feeds.
*   **Required Evidence**: Bus delay alerts, parking gate sensor logs.
*   **Applicable Policies**: Traffic management plans, parking override rules.
*   **Risk Level**: MEDIUM.
*   **Human Approval**: Re-routing suggestions shown to transport dispatch supervisor.

### 1.7 Operational Decisions
*   **Purpose**: Balance crowd queues, manage ticket scanning issues, and dispatch resources.
*   **Required Context**: Gate flow rates, average scanner verification times.
*   **Required Evidence**: Ingress telemetry logs, scanner network alerts.
*   **Applicable Policies**: Maximum queue duration limits (SLA).
*   **Risk Level**: MEDIUM.
*   **Human Approval**: Suggested to local Gate Supervisor.

### 1.8 Emergency Decisions
*   **Purpose**: Evacuate stadium seating zones or concourses due to extreme weather or safety breaches.
*   **Required Context**: Weather radar, lighting sensors, crowd counts.
*   **Required Evidence**: Meteorological authority storm warnings, safety breach logs.
*   **Applicable Policies**: Mega-event emergency evacuation protocols, legal safety limits.
*   **Risk Level**: CRITICAL.
*   **Human Approval**: STRICTLY requires Coordinator and Stadium Command sign-off.
""")

# 2. Decision Pipeline
write_spec("decision-pipeline.md", """
# Decision Pipeline Specification

This document defines the 13-stage canonical reasoning pipeline that MEVIS must execute to transform raw inputs into explainable, policy-compliant recommendations.

---

## The Canonical Pipeline Flow

```text
Observation ──> Context Assembly ──> Situation Assessment ──> Evidence Collection ──>
Hypothesis Gen ──> Reasoning ──> Risk Assessment ──> Policy Validation ──>
Recommendation Gen ──> Explanation Gen ──> Human Approval ──> Execution ──>
Outcome Evaluation ──> Learning
```

### Stage 1: Observation
*   **Goal**: Ingest signals (Volunteer reports, sensors, CCTV, weather APIs).
*   **Output**: Structured observation object.

### Stage 2: Context Assembly
*   **Goal**: Gather all surrounding world-state information (active shifts, resources, weather).
*   **Output**: Static context model. No reasoning is performed.

### Stage 3: Situation Assessment
*   **Goal**: Translate raw context parameters into logical operational states.
*   **Output**: Classification of potential problems or bottlenecks.

### Stage 4: Evidence Collection
*   **Goal**: Retrieve relevant procedural facts (SOPs, past incidents) and grade their freshness.
*   **Output**: Grounded evidence lists with reliability weights.

### Stage 5: Hypothesis Generation
*   **Goal**: Draft multiple candidate interpretations of the situation.
*   **Output**: Candidate hypothesis options.

### Stage 6: Reasoning
*   **Goal**: Evaluate options, filter contradictions, and rank the most probable interpretation.
*   **Output**: Ranked logical interpretation.

### Stage 7: Risk Assessment
*   **Goal**: Calculate safety, operational, and resource risks of candidate solutions.
*   **Output**: Quantitative multidimensional risk score.

### Stage 8: Policy Validation
*   **Goal**: Validate the actions against active stadium rules and access controls.
*   **Output**: Compliance check results. Non-compliant options are blocked.

### Stage 9: Recommendation Generation
*   **Goal**: Finalize candidate action tasks, expected execution timelines, and thresholds.
*   **Output**: Formatted recommendation contract.

### Stage 10: Explanation Generation
*   **Goal**: Compile explanations (supporting facts, rejected alternatives, assumptions).
*   **Output**: Justification payload.

### Stage 11: Human Approval
*   **Goal**: Escalate to human operator for verification depending on risk level.
*   **Output**: Signed approval validation record.

### Stage 12: Outcome Evaluation
*   **Goal**: Monitor execution and gather volunteer feedback.
*   **Output**: Outcome metrics payload.

### Stage 13: Learning
*   **Goal**: Feed decision metrics back into long-term memory.
*   **Output**: Updated similarity indexes and calibration scores.
""")

# 3. Decision Lifecycle
write_spec("decision-lifecycle.md", """
# Decision Lifecycle Specification

This document defines the lifecycle states and allowed transitions of the Decision object (`dec_`).

---

## 1. Lifecycle State Definitions

*   **Created**: Initial state when an observation triggers pipeline assembly.
*   **Analyzed**: Context assembly and situation assessment completed.
*   **RiskAssessed**: Multidimensional risk evaluation scores computed.
*   **PolicyValidated**: Checked against safety rules, SOP boundaries, and constraints.
*   **Recommended**: AI Orchestrator has finalized candidate tasks and justifications.
*   **Presented**: Recommendation is displayed on the target operator's screen interface.
*   **Accepted**: Human approved the suggestion, or low-risk auto-execution triggered.
*   **Rejected**: Operator dismissed the advice.
*   **Executed**: Underlying tasks have been dispatched and completed.
*   **Evaluated**: Execution outcomes, delays, and feedback metrics collected.
*   **Archived**: Logged into the long-term memory database for future similarity search.

---

## 2. Allowed Transitions

*   `Created` $\rightarrow$ `Analyzed`
*   `Analyzed` $\rightarrow$ `RiskAssessed`
*   `RiskAssessed` $\rightarrow$ `PolicyValidated`
*   `PolicyValidated` $\rightarrow$ `Recommended` (if policy checks pass)
*   `PolicyValidated` $\rightarrow$ `Rejected` (if policy checks fail)
*   `Recommended` $\rightarrow$ `Presented`
*   `Presented` $\rightarrow$ `Accepted`
*   `Presented` $\rightarrow$ `Rejected`
*   `Accepted` $\rightarrow$ `Executed`
*   `Executed` $\rightarrow$ `Evaluated`
*   `Evaluated` $\rightarrow$ `Archived`
""")

# 4. Reasoning Model
write_spec("reasoning-model.md", """
# Reasoning Model Specification

This document defines the logical reasoning framework used to evaluate hypotheses and resolve conflicting data.

---

## 1. Contradiction Resolution Protocols

Operational sensors or volunteer reports will sometimes disagree (e.g. Turnstile reports zero flow, CCTV shows dense queues). The reasoning engine MUST resolve contradictions using the following rules:

1.  **Trust Score Precedence**: Higher trust source wins (Camera CCTV trust 95% > Volunteer report trust 80% > Manual entry trust 65%).
2.  **Telemetry Freshness Check**: The newer timestamp telemetry overrides older data.
3.  **Active Verification Dispatch**: If the contradiction cannot be resolved mathematically, the engine MUST dispatch a low-risk verification task to the nearest volunteer.

---

## 2. Model Agnosticism
All reasoning logic and data contracts MUST remain model-agnostic. The structures must be parseable by GPT, Claude, Gemini, Llama, DeepSeek, or future intelligence engines without changing schemas.
""")

# 5. Hypothesis Framework
write_spec("hypothesis-framework.md", """
# Hypothesis Framework Specification

This document defines the generation, evaluation, and pruning of candidate hypotheses in the reasoning engine.

---

## 1. Hypothesis Generation
When an assessed situation presents ambiguity, the system MUST compile a list of mutually exclusive hypotheses.
*   *Example*: Crowd buildup at Gate C.
    *   **Hypothesis A**: Ticket scanner hardware offline delay.
    *   **Hypothesis B**: Ticket bottleneck due to gate lock restriction.
    *   **Hypothesis C**: Medical emergency roadblock in the concourse corridor.
    *   **Hypothesis D**: Match kickoff entry rush.

## 2. Pruning and Ranking
Hypotheses are ranked using a Bayesian likelihood ratio based on evidence grades:
\[ P(H | E) = \frac{P(E | H) P(H)}{P(E)} \]
Where:
*   \(P(H)\): Prior probability based on historical incidents.
*   \(P(E | H)\): Likelihood of observing sensor outputs under hypothesis H.
*   Any hypothesis with a computed probability below 15% MUST be pruned immediately to prevent AI recommendation hallucination.
""")

# 6. Evidence Model
write_spec("evidence-model.md", """
# Evidence Grading Model Specification

This document defines how evidence items are graded and weighted to prevent reasoning hallucination.

---

## 1. Evidence Attributes

Every evidence element in the RAG pipeline MUST include the following properties:
*   `source_id` (String): Source identifier.
*   `source_trust` (Float): Hardcoded trust score (0.0 to 1.0) based on category.
*   `timestamp` (ISO-8601): Observation time.
*   `freshness` (Float): Decay function of age.
*   `reliability` (Float): Historical success tracking.

---

## 2. Source Trust Score Registry

*   **Fixed CCTV Video Telemetry**: 0.95
*   **Turnstile Sensors**: 0.92
*   **Meteorological Authority API**: 0.90
*   **Active Volunteer App GPS**: 0.85
*   **Supervisor Manual Check-In**: 0.80
*   **Volunteer Text Report**: 0.70
*   **Unverified Fan Social Feed**: 0.30
""")

# 7. Confidence Model
write_spec("confidence-model.md", """
# Confidence Scoring Model Specification

This document establishes the quantitative formula for calculating recommendation confidence scores.

---

## 1. The Confidence Formula

The reasoning engine MUST calculate a Recommendation's confidence score using the following formula:

\[ \text{Confidence} = w_e \cdot E_{\text{strength}} + w_c \cdot C_{\text{freshness}} + w_p \cdot P_{\text{alignment}} + w_s \cdot S_{\text{similarity}} \]

Where:
*   \(E_{\text{strength}}\): Mean trust score of supporting evidence (0.0 - 1.0).
*   \(C_{\text{freshness}}\): Context age factor (1.0 if age < 30 sec, decays exponentially).
*   \(P_{\text{alignment}}\): Policy compliance score (1.0 if fully compliant, 0.0 if any violation).
*   \(S_{\text{similarity}}\): Similarity score to historically successful cases in memory database.
*   Weights: \(w_e = 0.4\), \(w_c = 0.2\), \(w_p = 0.3\), \(w_s = 0.1\).

---

## 2. Threshold Constraints
*   **Auto-Release Threshold**: Confidence MUST exceed 0.85 for low-risk decisions.
*   **Triage Minimum Threshold**: If confidence is below 0.60, the recommendation MUST NOT be presented. Instead, a request for information is generated.
""")

# 8. Explainability Model
write_spec("explainability-model.md", """
# Explainability Model Specification

This document defines the structural template and rules for compiling explainable justifications for all AI decisions.

---

## 1. Explanation Contract Structure

Every recommendation explanation MUST contain the following sections:
1.  **Decision Summary**: Concise business overview of what is recommended.
2.  **Supporting Evidence**: Bulleted list of facts, timestamps, and source ratings.
3.  **Key Assumptions**: Grounding assumptions (e.g. "Assuming rain will continue for 30 minutes").
4.  **Rejected Alternatives**: Description of alternate paths considered and reasons for dismissal.
5.  **Remaining Risks**: Known trade-offs (e.g. "Reassigning Steward B leaves Gate 4 with lower staffing").
6.  **Policy Citations**: Reference IDs to active SOPs and bylaws.
""")

# 9. Decision Memory
write_spec("decision-memory.md", """
# Decision Memory Specification

This document defines how decision objects are committed to and retrieved from memory.

---

## 1. Storage Schema
For every evaluated decision, the Analytics & Learning context MUST save:
*   `decision_id`: String.
*   `context_vector`: Compact feature map.
*   `recommendation_id`: String.
*   `human_action`: Accepted / Rejected / Overridden.
*   `outcome_success`: Boolean.

## 2. Similarity Search
Reasoning engines MUST query the memory index using Cosine Similarity on incoming contexts to fetch the top 3 similar past cases. This historical success rate directly calibrates the confidence model.
""")

# 10. Decision Provenance
write_spec("decision-provenance.md", """
# Decision Provenance & Audit Trail Specification

This document defines the schema for compiling historical audit logs of decisions.

---

## 1. Audit Trail Mappings

The system MUST maintain an immutable cryptographic record mapping:

```text
[Observation ID] ──> [Context Assembly Hash] ──> [Evidence Reference IDs] ──>
[Hypothesis Probabilities] ──> [Risk Score] ──> [Policy Engine Pass Hash] ──>
[Recommendation ID] ──> [Human Approval Signature] ──> [Task Completion Events]
```

This sequence guarantees that any coordinator or auditor can reconstruct exactly why an action was taken.
""")

# 11. Decision Metrics
write_spec("decision-metrics.md", """
# Decision Metrics Specification

This document defines the key performance indicators tracked to audit AI reasoning.

---

## 1. Core KPIs

*   **Acceptance Rate (AR)**: Number of recommendations accepted by operators divided by total recommendations presented.
*   **Human Override Rate (HOR)**: Ratio of recommendations rejected in favor of manually drafted actions.
*   **Policy Violations (PV)**: Number of AI recommendations that violated a policy (MUST remain 0).
*   **Decision Latency (DL)**: Seconds from observation ingestion to ready recommendation.
*   **Utility Calibration (UC)**: Correlation coefficient between predicted confidence and actual task success rates.
""")

# 12. Human Collaboration
write_spec("human-collaboration.md", """
# Human-AI Collaboration Specification

This document establishes the authority boundaries, approval protocols, and human control overrides.

---

## 1. Interaction Modes

*   **Autonomous Mode**: Low-risk accessibility tasks or volunteer fatigue breaks. The system dispatches automatically.
*   **Approval Mode**: Standard medical or security incident dispatches. AI drafts the tasks, but a zone Supervisor must approve the release.
*   **Locked Mode**: Critical evacuations, stadium gate locks, or severe weather alerts. Coordinator manual authorization is mandatory.

---

## 2. Override Logs
When a Supervisor rejects a recommendation, they MUST select or enter a rejection reason. This reason is logged to Decision Memory.
""")

# 13. Policy Contract
write_spec("policy-contract.md", """
# Policy Engine Contract Specification

This document defines the interface input and output schemas for the Policy Validation Gate.

---

## 1. Input Contract
*   `context` (Object): Active stadium telemetry context.
*   `proposed_actions` (Array of Tasks): Suggested instructions.
*   `risk_profiles` (Object): safety and operational risk indexes.

## 2. Output Contract
*   `status` (String): `PASSED`, `BLOCKED`, `ESCALATED`.
*   `violating_rule_id` (String, Optional): Mapped invariant identifier.
*   `remediation` (String, Optional): Advice for re-planning.
""")

# 14. Failure Modes
write_spec("failure-modes.md", """
# Failure Modes Specification

This document defines system behaviors when context or evidence is missing or corrupted.

---

## 1. Context Starvation
*   *Detection*: Critical telemetry fields (like active volunteer locations) are null or stale.
*   *Action*: System MUST degrade to manual override mode, label confidence as LOW, and ask operators for information.

## 2. Policy Conflict
*   *Detection*: Two policies output contradictory results (e.g. evacuation requires opening gates, but security lockdown requires locking gates).
*   *Action*: Fail-closed. Immediately halt autonomous dispatch, escalate to Coordinator, and trigger manual override.
""")

# 15. Risk Matrix
write_spec("risk-matrix.md", """
# Risk Matrix Specification

This document defines the multi-dimensional risk assessment scoring model.

---

## 1. Risk Dimensions

Every Recommendation MUST evaluate risk across five dimensions on a scale of 1 to 5 (1 = Minimal, 5 = Critical):
1.  **Safety Risk**: Danger to fans, staff, or volunteers.
2.  **Operational Risk**: Stadium flow bottlenecks or scan delays.
3.  **Reputational Risk**: Media or public perception.
4.  **Resource Risk**: Starving other zones of volunteers.
5.  **Time Criticality**: Rapid progression likelihood.

## 2. Escalation Logic
*   If Safety Risk $\ge$ 4 $\rightarrow$ Escalate to Coordinator, enforce Approval Lock.
*   If Operational Risk $\ge$ 3 $\rightarrow$ Notify Zone Supervisor.
""")

print("Successfully generated all 15 cognitive specification documents.")
