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
