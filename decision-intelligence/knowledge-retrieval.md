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

- `sop_id` (String): Mapped standard operating procedure database ID.
- `clause_num` (String): Specific section reference (e.g., Section 4.2).
- `freshness` (Float): Date validation factor.
