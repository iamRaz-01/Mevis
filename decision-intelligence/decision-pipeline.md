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

- **Goal**: Ingest signals (Volunteer reports, sensors, CCTV, weather APIs).
- **Output**: Structured observation object.

### Stage 2: Context Assembly

- **Goal**: Gather all surrounding world-state information (active shifts, resources, weather).
- **Output**: Static context model. No reasoning is performed.

### Stage 3: Situation Assessment

- **Goal**: Translate raw context parameters into logical operational states.
- **Output**: Classification of potential problems or bottlenecks.

### Stage 4: Evidence Collection

- **Goal**: Retrieve relevant procedural facts (SOPs, past incidents) and grade their freshness.
- **Output**: Grounded evidence lists with reliability weights.

### Stage 5: Hypothesis Generation

- **Goal**: Draft multiple candidate interpretations of the situation.
- **Output**: Candidate hypothesis options.

### Stage 6: Reasoning

- **Goal**: Evaluate options, filter contradictions, and rank the most probable interpretation.
- **Output**: Ranked logical interpretation.

### Stage 7: Risk Assessment

- **Goal**: Calculate safety, operational, and resource risks of candidate solutions.
- **Output**: Quantitative multidimensional risk score.

### Stage 8: Policy Validation

- **Goal**: Validate the actions against active stadium rules and access controls.
- **Output**: Compliance check results. Non-compliant options are blocked.

### Stage 9: Recommendation Generation

- **Goal**: Finalize candidate action tasks, expected execution timelines, and thresholds.
- **Output**: Formatted recommendation contract.

### Stage 10: Explanation Generation

- **Goal**: Compile explanations (supporting facts, rejected alternatives, assumptions).
- **Output**: Justification payload.

### Stage 11: Human Approval

- **Goal**: Escalate to human operator for verification depending on risk level.
- **Output**: Signed approval validation record.

### Stage 12: Outcome Evaluation

- **Goal**: Monitor execution and gather volunteer feedback.
- **Output**: Outcome metrics payload.

### Stage 13: Learning

- **Goal**: Feed decision metrics back into long-term memory.
- **Output**: Updated similarity indexes and calibration scores.
