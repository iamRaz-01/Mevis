# Reasoning Architecture Specification

Consolidates reasoning models, Bayesian hypothesis evaluations, and conflict resolution rules.

---

## 1. Contradiction Resolution Protocols

- **Precedence**: CCTV Camera telemetry trust (0.95) overrides Volunteer Text reports (0.70).
- **Freshness**: Telemetry timestamps staler than 30 seconds are ignored.

---

## 2. Bayesian Hypothesis Ranking

Hypotheses are evaluated using:
\[ P(H | E) = rac{P(E | H) P(H)}{P(E)} \]
Candidates with probabilities below 15% are immediately pruned.
