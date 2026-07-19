# Confidence Propagation Specification

Defines how trust and confidence scores propagate from raw observations through derived world state entities.

---

## 1. Propagation Rules

Confidence is calculated hierarchically:

1.  **Observation Layer**: Raw observation is assigned a trust score based on source.
2.  **Derived Entity Layer**: Entity properties derived from multiple observations inherit the joint probability:
    \[ C_{\text{entity}} = 1 - \prod_{i=1}^n (1 - C_i) \]
3.  **Conflict Decay**: If two observations conflict, the propagated confidence is multiplied by a disagreement decay factor of 0.60.
