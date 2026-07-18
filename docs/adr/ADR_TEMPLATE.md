# ADR-XXX: [Title of Architectural Decision]

- **Status**: [Proposed | Accepted | Rejected | Deprecated]
- **Date**: [YYYY-MM-DD]
- **Authors**: [Author Name(s) / Agent Role]
- **Target Open Decisions**: [Optional - e.g., Resolves OD-002, OD-004]
- **Prerequisites / Dependencies**: [Optional - e.g., Requires ADR-001]

---

## 1. Context

Describe the context, technical background, and the problem this decision addresses.

- What is the specific challenge, ambiguity, or constraint we are facing?
- How does this problem impact the volunteer operations or the platform?
- What architectural objectives or metrics (e.g., MTOR, groundedness) are affected?

Ensure the context refers back to the **[Product Vision](../product/Product%20Vision%20doc%20v1.0.md)** and the **[MEVIS Engineering Constitution](../engineering/MEVIS%20Product%20Constitution.md)** to justify why this decision is necessary.

---

## 2. Decision

State the exact decision that is being adopted.

- Use clear, precise, and declarative statements.
- Enforce constraints using normative RFC 2119 terminology (**MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, **MAY**).
- Specify boundaries: What is included, and what is explicitly out of scope for this decision.

---

## 3. Alternatives Considered

Outline the alternative architectural options that were evaluated:

### Alternative A: [Name of Alternative A]

- **Description**: Brief summary of the approach.
- **Reason for Rejection**: Why this was not chosen (e.g., complexity, failure to meet MEC invariants, latency concerns, cost, etc.).

### Alternative B: [Name of Alternative B]

- **Description**: Brief summary of the approach.
- **Reason for Rejection**: Why this was not chosen.

---

## 4. Trade-offs and Consequences

Document the implications of adopting this decision. Be objective and explicit about both benefits and costs.

### Pros (Benefits)

- [Benefit 1 - e.g., Reduces MTOR by caching world-state diffs]
- [Benefit 2]

### Cons (Costs / Technical Debt / Risks)

- [Risk/Cost 1 - e.g., Requires extra memory overhead for Redis]
- [Risk/Cost 2]

---

## 5. MEC Invariant & Compliance Audit

To ensure the integrity of the platform architecture, verify that this decision complies with the core invariants of the **[MEVIS Engineering Constitution](../engineering/MEVIS%20Product%20Constitution.md)**:

| Invariant                                        | Compliance Verification                                                   |
| :----------------------------------------------- | :------------------------------------------------------------------------ |
| **INV-001** (AI-native operational intelligence) | [Describe how this decision aligns with AI-native architecture]           |
| **INV-002** (Human authority override)           | [Confirm this decision does not bypass human oversight]                   |
| **INV-003** (Augment, not replace humans)        | [Confirm this decision operates in recommendation capacity]               |
| **INV-004** (Grounded in evidence)               | [Confirm data/logic grounding mechanisms]                                 |
| **INV-005** (Explainability)                     | [Describe how this preserves or enhances decision graph trace visibility] |
| **INV-006** (Safety over optimization)           | [Verify that safety policies take precedence under this decision]         |
| **INV-007** (Continuous learning)                | [Describe impact on outcome tracking or learning loop data]               |

---

## 6. References

- [MEC Chapter 1 (MEVIS Product Constitution.md)](../engineering/MEVIS%20Product%20Constitution.md)
- [Product Vision (Product Vision doc v1.0.md)](../product/Product%20Vision%20doc%20v1.0.md)
- [Other related ADRs, issues, or specifications]
