import os

DEC_INT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../decision-intelligence"))
os.makedirs(DEC_INT_DIR, exist_ok=True)

def write_spec(filename, content):
    filepath = os.path.join(DEC_INT_DIR, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")
    print(f"Generated {filename}")

# 1. World State Engine
write_spec("world-state-engine.md", """
# World State Engine Specification

This specification defines the logical structure and tracking model for the live **stadium world state**.

---

## 1. World State Schema

The World State is the in-memory consolidation of the stadium at time $T$. It is structured as follows:

*   **Venue**: Live gates access states, capacity occupancy rates, elevator statuses.
*   **Zones**: Active seating blocks, spectator congestion densities.
*   **Gates**: Ingress/egress passenger entry flows, scanning speed alerts.
*   **Volunteers**: Active check-in profiles, physical locations, check-in shift status.
*   **Incidents**: Tracked incident lifecycles, locations, assigned paramedics.
*   **Weather**: Meteorological telemetry, rain probability indicators.
*   **Resources**: Available medical kits, transport shuttles, safety equipment.
*   **Knowledge**: Citations, retrieved SOP guidelines.
*   **Recommendations**: Dispatched tasks, active and historical.

---

## 2. In-Memory Engine Update Cycle
Every new observation parsed MUST invoke context assembly to compute delta modifications to the World State.
""")

# 2. Context Builder
write_spec("context-builder.md", """
# Context Builder Specification

This specification defines the translation pipeline from raw telemetry inputs into structured World State updates.

---

## 1. Context Assembly Pipeline

```text
Telemetry Observation Ingestion ──> Static Metadata Hydration ──>
Deduplication / Conflict Resolution ──> World State Delta compilation ──>
Reasoning Engine Input Trigger
```

### 1.1 Ingestion
Raw observations are parsed and graded for source trust.

### 1.2 Hydration
The observation is hydrated with static stadium metadata (e.g. mapping gate IDs to geographical zones).

### 1.3 Deduplication
If multiple sources report the same incident, they are merged using matching correlation hashes.

### 1.4 Trigger
The finalized World State payload is pushed to the reasoning engine inputs.
""")

# 3. Knowledge Retrieval
write_spec("knowledge-retrieval.md", """
# Knowledge Retrieval Architecture

This document defines the RAG retrieval pipeline for operational procedures.

---

## 1. Retrieval Flow

```text
Query Compilation ──> Vector Similarity search ──>
Re-ranking (BM25 + Cross-Encoder) ──> Evidence Assembly ──> Citation Generator
```

### 1.1 Citation Builder Rules
Every citation generated for the reasoning engine MUST reference:
*   `sop_id` (String): Mapped standard operating procedure database ID.
*   `clause_num` (String): Specific section reference (e.g., Section 4.2).
*   `freshness` (Float): Date validation factor.
""")

# 4. Trust Model
write_spec("trust-model.md", """
# Trust & Confidence Grading Model

This specification defines the multi-dimensional trust grading model for MEVIS.

---

## 1. Trust Scoring Logic

Confidence is not a single number; it is calculated using:
*   **Evidence Quality**: Mapped source weights (CCTV camera = 0.95 vs. Manual check = 0.70).
*   **Context Completeness**: Missing context parameters reduce score.
*   **Policy Alignment**: Policies MUST validate actions (violations force confidence to 0.00).
*   **Historical Similarity**: Similarity success indicators scale score.

---

## 2. Math Formula
\[ \text{Confidence} = w_e \cdot E_{\text{strength}} + w_c \cdot C_{\text{freshness}} + w_p \cdot P_{\text{alignment}} + w_h \cdot H_{\text{success}} \]
Where:
*   \(w_e = 0.4, w_c = 0.2, w_p = 0.3, w_h = 0.1\).
""")

# 5. Memory Architecture
write_spec("memory-architecture.md", """
# Memory Architecture Specification

This specification defines the memory tiers of the MEVIS platform.

---

## 1. Memory Tiers

*   **Session Memory**: Live conversation logs and user state sessions.
*   **Operational Memory**: Active stadium World State updates for the current match.
*   **Long-Term Memory**: Database of historical incidents, resolutions, and user check-in profiles.
*   **Knowledge Memory**: Mapped index of stadium manuals, SOP regulations, and maps.
*   **Reflection Memory**: Auto-generated performance assessments and model evaluations.
""")

# 6. Agent Specifications
write_spec("agent-specifications.md", """
# AI Component Agent Specifications

This document defines input/output contracts and constraints for each cognitive agent.

---

## 1. Agent Registry

### 1.1 Observation Agent
*   **Inputs**: Raw text, sensor data, CCTV logs.
*   **Outputs**: JSON observation contracts.

### 1.2 Context Builder
*   **Inputs**: Observation object + Static database parameters.
*   **Outputs**: Updated World State delta maps.

### 1.3 Retriever Agent
*   **Inputs**: World State context query.
*   **Outputs**: Graded SOP citation records.

### 1.4 Planner Agent
*   **Inputs**: Hydrated context + SOP citation.
*   **Outputs**: Candidate task action plans.

### 1.5 Risk Assessor Agent
*   **Inputs**: Candidate action plans.
*   **Outputs**: Risk evaluation metrics (Safety, Operations).

### 1.6 Policy Validator Agent
*   **Inputs**: Action plans + Mapped stadium rules.
*   **Outputs**: Pass / Fail compliance tokens.

### 1.7 Recommendation Generator
*   **Inputs**: Validated action plans.
*   **Outputs**: Published recommendation object.

### 1.8 Explainer Agent
*   **Inputs**: Planner traces + evidence logs.
*   **Outputs**: Textual explanation justification logs.

### 1.9 Evaluator Agent
*   **Inputs**: Actual outcomes + target logs.
*   **Outputs**: Reflection performance metrics.
""")

# 7. Evaluation Framework
write_spec("evaluation-framework.md", """
# Evaluation Framework Specification

Defines quality and safety thresholds evaluated on the platform.

---

## 1. Metric Thresholds

*   **Groundedness**: All recommendations MUST ground in fetched SOP evidence.
*   **Faithfulness**: Reasoning trace details MUST align with actual contexts.
*   **Policy Compliance**: Violations of stadium policies MUST equal zero.
*   **Latency**: Recommendation generation latency MUST remain under 5.0 seconds.
*   **Human Acceptance**: Mapped ratio of accepted recommendations. Target: $> 85\%$.
""")

# 8. Simulation Framework
write_spec("simulation-framework.md", """
# Simulation Framework Specification

This specification defines the pipeline for validating reasoning capabilities against mock scenarios.

---

## 1. Simulation Pipeline Flow

```text
Scenario Library Ingestion ──> Telemetry Simulator ──>
Expected Outcomes comparison ──> Evaluator Reflection
```

This pipeline allows automated regression testing of AI planners prior to release.
""")

# 9. AI Governance
write_spec("ai-governance.md", """
# AI Governance & Safety Constraints

Defines prompts, safety guards, and version control for AI components.

---

## 1. Model Selection Rules
*   Low-risk classification tasks use lightweight models (e.g. Flash models).
*   High-risk planning tasks use reasoner models (e.g. Pro models).

## 2. Safety Rollback
*   If an LLM prompt update drops safety compliance below 100%, the system MUST automatically rollback to the last stable prompt version.
""")

# 10. Reasoning Architecture (Merged)
write_spec("reasoning-architecture.md", """
# Reasoning Architecture Specification

Consolidates reasoning models, Bayesian hypothesis evaluations, and conflict resolution rules.

---

## 1. Contradiction Resolution Protocols
*   **Precedence**: CCTV Camera telemetry trust (0.95) overrides Volunteer Text reports (0.70).
*   **Freshness**: Telemetry timestamps staler than 30 seconds are ignored.

---

## 2. Bayesian Hypothesis Ranking
Hypotheses are evaluated using:
\[ P(H | E) = \frac{P(E | H) P(H)}{P(E)} \]
Candidates with probabilities below 15% are immediately pruned.
""")

# 11. Decision Governance (Merged)
write_spec("decision-governance.md", """
# Decision Governance Specification

Consolidates decision memory storage, provenance mapping, and metrics tracking.

---

## 1. Provenance Audit Trails
Every recommendation MUST record the lineage hash chain:
`Observation ID` $\rightarrow$ `Context Assembly Hash` $\rightarrow$ `Evidence IDs` $\rightarrow$ `Risk Score` $\rightarrow$ `Policy Pass` $\rightarrow$ `Recommendation ID`.

---

## 2. Core KPIs
*   **Acceptance Rate (AR)**: Target $> 85\%$.
*   **Human Override Rate (HOR)**: Target $< 15\%$.
*   **Decision Latency**: Target $< 5$ sec.
""")

# 12. Decision Pipeline (Updated)
write_spec("decision-pipeline.md", """
# Decision Pipeline Specification

This document defines the canonical workflow stages for processing observations.

---

## 1. Decision pipeline Stages

1.  **Observation**: Ingest signals.
2.  **Context Assembly**: Hydrate static metrics.
3.  **World State Engine Update**: Modify active state.
4.  **Situation Assessment**: Classify risk status.
5.  **Evidence Collection**: Query SOPs.
6.  **Reasoning Architecture**: Rank hypotheses.
7.  **Action Planning**: Plan logical tasks.
8.  **Recommendation Generation**: Compile outputs.
9.  **Explanation Generation**: Draft justifications.
10. **Human Approval**: Lock gates check.
11. **Execution**: Dispatches.
12. **Outcome Evaluation**: Log actual results.
13. **Governance & Learning**: Log to memory.
""")

# 13. Decision Taxonomy (Updated)
write_spec("decision-taxonomy.md", """
# Decision Taxonomy Specification

Defines decision types and operational bounds.

---

## 1. Decision Categories
*   **Navigation**: Crowd redirection, volunteer pathings.
*   **Medical**: EMS dispatch alerts.
*   **Security**: Perimeter checks.
*   **Accessibility**: ADA compliance elevator overrides.
*   **Volunteer**: Workload fatigue breaks.
*   **Transport**: Spectator shuttle routings.
*   **Operational**: turnstile capacity overrides.
*   **Emergency**: evacuation locks.
""")

print("Successfully generated all updated cognitive documents.")
