import os

INGESTION_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../knowledge-ingestion"))
os.makedirs(INGESTION_DIR, exist_ok=True)

def write_file(filename, content):
    filepath = os.path.join(INGESTION_DIR, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")
    print(f"Generated {filename}")

# 1. ingestion-pipeline.md
write_file("ingestion-pipeline.md", """
# Knowledge Ingestion Pipeline Specification

Defines the cognitive ingestion workflow mapping raw operational sources to canonical structured Knowledge Objects.

---

## 1. Processing Stages
Raw sources proceed sequentially through:
1.  **Validation**: Compliance check of metadata and source tags.
2.  **Parsing**: Extraction of structural sections and lists.
3.  **Cleaning**: Page headers, footers, numbers removal.
4.  **Normalization**: Terminology alignment.
5.  **Chunking**: Semantic segment boundaries separation.
6.  **Metadata Extraction**: Generating attributes.
7.  **Final Quality Validation**: Invariant audits before repository availability.
""")

# 2. supported-sources.md
write_file("supported-sources.md", """
# Supported Knowledge Sources

Categorizes document types ingested by the pipeline.

---

## 1. Classifications
*   `StandardOperatingProcedure`: Operations sequences (Medical, Security, Volunteer).
*   `EmergencyPlaybook`: Hazard evacuation procedures.
*   `PolicyDocument`: Static governance rules.
*   `GuidelineDocument`: Reference manuals and training guides.
""")

# 3. validation.md
write_file("validation.md", """
# Document Ingress Validation

Audits document characteristics before parsing runs.

---

## 1. Validation Criteria
*   **Completeness**: Must specify owner metadata.
*   **Approval**: Must possess valid compliance signs.
*   **Lifecycle**: Must hold status `Draft` or `Approved`.
""")

# 4. parsing.md
write_file("parsing.md", """
# Content Parsing Specification

Details content extraction from documents.

---

## 1. Structural Boundaries Rules
*   Headers and headings MUST map to hierarchical levels.
*   Tables MUST convert to standardized logical structures.
""")

# 5. ocr-handling.md
write_file("ocr-handling.md", """
# OCR & Non-Text Knowledge Handling

Specifies processing constraints for scanned images.

---

## 1. Extracted Text Normalization
*   Scanned documents MUST undergo double pass quality audits, converting structural signs and banners into standardized text fields.
""")

# 6. cleaning.md
write_file("cleaning.md", """
# Content Cleaning Specification

Removes non-operational formatting noise.

---

## 1. Noise Exclusions
*   The cleaning stage MUST filter out page numbers, repeated headers/footers, and margin decor elements.
""")

# 7. normalization.md
write_file("normalization.md", """
# Normalization Specification

Aligns extracted terminology with ubiquitous vocabulary.

---

## 1. Terminology Alignment Rules
*   References to "Steward" or "Patroller" MUST map to the canonical entity term `Volunteer`.
*   Metric units MUST standardize to metric systems ($m^2$, meters, seconds).
""")

# 8. chunking.md
write_file("chunking.md", """
# Knowledge Chunking Specification

Segments content into semantic units.

---

## 1. Segmentation Principles
*   Chunks MUST NOT segment mid-paragraph.
*   Every chunk MUST preserve a reference back to parent asset identifiers.
""")

# 9. metadata-extraction.md
write_file("metadata-extraction.md", """
# Metadata Extraction Specification

Enriches chunk segments with metadata.

---

## 1. Attribute Mapping
Every generated chunk maps:
*   `chunk_id`: String tag.
*   `parent_asset_id`: Correlated knowledge asset.
*   `scope_domain`: Bounded context label.
""")

# 10. processing-lifecycle.md
write_file("processing-lifecycle.md", """
# Processing Lifecycle Specification

Defines processing state progression.

---

## 1. Processing States
*   `Received`: Source received.
*   `Parsed`: Extraction completed.
*   `Segmented`: Chunk segments built.
*   `Available`: Validated and published in repository.
""")

print("Successfully generated all 10 knowledge-ingestion specs.")
