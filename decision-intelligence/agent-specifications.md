# AI Component Agent Specifications

This document defines input/output contracts and constraints for each cognitive agent.

---

## 1. Agent Registry

### 1.1 Observation Agent

- **Inputs**: Raw text, sensor data, CCTV logs.
- **Outputs**: JSON observation contracts.

### 1.2 Context Builder

- **Inputs**: Observation object + Static database parameters.
- **Outputs**: Updated World State delta maps.

### 1.3 Retriever Agent

- **Inputs**: World State context query.
- **Outputs**: Graded SOP citation records.

### 1.4 Planner Agent

- **Inputs**: Hydrated context + SOP citation.
- **Outputs**: Candidate task action plans.

### 1.5 Risk Assessor Agent

- **Inputs**: Candidate action plans.
- **Outputs**: Risk evaluation metrics (Safety, Operations).

### 1.6 Policy Validator Agent

- **Inputs**: Action plans + Mapped stadium rules.
- **Outputs**: Pass / Fail compliance tokens.

### 1.7 Recommendation Generator

- **Inputs**: Validated action plans.
- **Outputs**: Published recommendation object.

### 1.8 Explainer Agent

- **Inputs**: Planner traces + evidence logs.
- **Outputs**: Textual explanation justification logs.

### 1.9 Evaluator Agent

- **Inputs**: Actual outcomes + target logs.
- **Outputs**: Reflection performance metrics.
