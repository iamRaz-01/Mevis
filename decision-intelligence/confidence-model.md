# Confidence Scoring Model Specification

This document establishes the quantitative formula for calculating recommendation confidence scores.

---

## 1. The Confidence Formula

The reasoning engine MUST calculate a Recommendation's confidence score using the following formula:

\[ ext{Confidence} = w_e \cdot E_{ ext{strength}} + w_c \cdot C_{ ext{freshness}} + w_p \cdot P_{ ext{alignment}} + w_s \cdot S_{ ext{similarity}} \]

Where:

- \(E_{ ext{strength}}\): Mean trust score of supporting evidence (0.0 - 1.0).
- \(C_{ ext{freshness}}\): Context age factor (1.0 if age < 30 sec, decays exponentially).
- \(P_{ ext{alignment}}\): Policy compliance score (1.0 if fully compliant, 0.0 if any violation).
- \(S_{ ext{similarity}}\): Similarity score to historically successful cases in memory database.
- Weights: \(w_e = 0.4\), \(w_c = 0.2\), \(w_p = 0.3\), \(w_s = 0.1\).

---

## 2. Threshold Constraints

- **Auto-Release Threshold**: Confidence MUST exceed 0.85 for low-risk decisions.
- **Triage Minimum Threshold**: If confidence is below 0.60, the recommendation MUST NOT be presented. Instead, a request for information is generated.
