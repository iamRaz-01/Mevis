# Decision Memory Specification

This document defines how decision objects are committed to and retrieved from memory.

---

## 1. Storage Schema

For every evaluated decision, the Analytics & Learning context MUST save:

- `decision_id`: String.
- `context_vector`: Compact feature map.
- `recommendation_id`: String.
- `human_action`: Accepted / Rejected / Overridden.
- `outcome_success`: Boolean.

## 2. Similarity Search

Reasoning engines MUST query the memory index using Cosine Similarity on incoming contexts to fetch the top 3 similar past cases. This historical success rate directly calibrates the confidence model.
