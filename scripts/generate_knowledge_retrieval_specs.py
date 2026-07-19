import os

RETRIEVAL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../knowledge-retrieval"))
os.makedirs(RETRIEVAL_DIR, exist_ok=True)

def write_file(filename, content):
    filepath = os.path.join(RETRIEVAL_DIR, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")
    print(f"Generated {filename}")

# 1. retrieval-architecture.md
write_file("retrieval-architecture.md", """
# Knowledge Indexing & Retrieval Architecture

Defines the logical retrieval system mapping Downstream queries to Evidence Packages.

---

## 1. Retrieval Flow Pipeline
Retrieval proceeds through:
1.  **Query Interpretation**: Parsing intent.
2.  **Hybrid Retrieval**: Matching semantic, keyword, and metadata filters.
3.  **Ranking**: Evaluating candidate relevance and trust weights.
4.  **Evidence Selection**: Compiling context citations.
""")

# 2. embeddings.md
write_file("embeddings.md", """
# Semantic Representation (Embeddings)

Defines semantic mappings independent of model algorithms.

---

## 1. Semantic Features
*   Embeddings represent conceptual coordinates mapping domain meanings.
*   Similar operational situations (e.g. cardiac collapse, spectator heat stroke) MUST cluster closely.
""")

# 3. indexing.md
write_file("indexing.md", """
# Index Architecture

Defines the logical partitioning of searchable knowledge space.

---

## 1. Index Partitions
*   **Domain Partitions**: Segregates indexes by metadata (Medical, Security, Volunteer).
*   **Version Partitioning**: Ensures version alignment.
""")

# 4. query-understanding.md
write_file("query-understanding.md", """
# Query Understanding Specification

Defines query interpretation rules.

---

## 1. Query Normalization Rules
*   Queries MUST extract: Bounded domain context, target location coordinates, and severity level triggers.
""")

# 5. hybrid-retrieval.md
write_file("hybrid-retrieval.md", """
# Hybrid Retrieval Specification

Combines multiple retrieval strategies.

---

## 1. Combination Strategy
*   Hybrid retrieval MUST merge results from Semantic Relevance, Lexical Matching, and Metadata Constraints.
""")

# 6. semantic-retrieval.md
write_file("semantic-retrieval.md", """
# Semantic Retrieval Specification

Defines concept similarity retrieval metrics.

---

## 1. Semantic Matching Rules
*   Matches candidates based on semantic proximity of query intent maps.
""")

# 7. lexical-retrieval.md
write_file("lexical-retrieval.md", """
# Lexical & Structural Retrieval

Targets exact keyword matching.

---

## 1. Exact Matching Fields
*   Exact matches MUST execute on identifiers: Gate IDs, Zone codes, and Incident codes.
""")

# 8. ranking.md
write_file("ranking.md", """
# Retrieval Ranking Specification

Details candidate re-ranking criteria.

---

## 1. Re-Ranking Parameters
Candidates are sorted based on:
1.  **Operational Applicability**: Location proximity relevance.
2.  **Trust Score**: Ingestion governance sign-offs weight.
3.  **Freshness**: Telemetry update recency.
""")

# 9. evidence-selection.md
write_file("evidence-selection.md", """
# Evidence Selection Specification

Compiles the final Evidence Package.

---

## 1. Evidence Boundaries Rules
*   The system MUST return ONLY relevant chunk content snippets rather than complete documents.
*   Every citation MUST include parent document name, version, section, and owner ID tags.
""")

# 10. retrieval-quality.md
write_file("retrieval-quality.md", """
# Retrieval Quality & Metrics

Defines evaluation metrics auditing retrieval health.

---

## 1. Quality Indicators
*   **Precision Index**: Ratio of contextually applicable steps to total returned evidence.
*   **Explainability Grade**: Logged reasons explaining why each candidate was matched.
""")

# 11. retrieval-lifecycle.md
write_file("retrieval-lifecycle.md", """
# Retrieval Lifecycle Specification

Maps retrieval lifecycle stages.

---

## 1. Stages
*   `Requested`: Query parsed.
*   `Retrieved`: Candidates fetched.
*   `Ranked`: Sorting applied.
*   `Selected`: Evidence Package compiled and published.
""")

print("Successfully generated all 11 knowledge-retrieval specs.")
