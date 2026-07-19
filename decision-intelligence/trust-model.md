# Trust & Confidence Grading Model

This specification defines the multi-dimensional trust grading model for MEVIS.

---

## 1. Trust Scoring Logic

Confidence is not a single number; it is calculated using:

- **Evidence Quality**: Mapped source weights (CCTV camera = 0.95 vs. Manual check = 0.70).
- **Context Completeness**: Missing context parameters reduce score.
- **Policy Alignment**: Policies MUST validate actions (violations force confidence to 0.00).
- **Historical Similarity**: Similarity success indicators scale score.

---

## 2. Math Formula

\[ ext{Confidence} = w_e \cdot E_{ ext{strength}} + w_c \cdot C_{ ext{freshness}} + w_p \cdot P_{ ext{alignment}} + w_h \cdot H_{ ext{success}} \]
Where:

- \(w_e = 0.4, w_c = 0.2, w_p = 0.3, w_h = 0.1\).
