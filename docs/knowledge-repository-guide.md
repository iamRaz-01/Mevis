# MEVIS Knowledge Repository Guide

This guide describes the authoritative Knowledge Repository implemented under Milestone 5. It handles logical organizational knowledge asset storage, multi-document format support, versioning logs, soft deletes/archiving, and security capabilities mapping.

---

## 1. Relational Model

The schema separates logical **Assets** from physical **Documents** and chronological **Versions**:

```text
+-------------------+
|  Knowledge Asset  |  <-- Represents the logical entity (e.g. "Volunteer Handbook")
+-------------------+
          |
          v (1 : N)
+--------------------+
| Knowledge Document |  <-- Represents a format representation (e.g. PDF version, DOCX format)
+--------------------+
          |
          v (1 : N)
+--------------------+
|  Document Version  |  <-- Represents physical file uploads with SHA-256 and SemVer logs
+--------------------+
```

---

## 2. Governance Metadata Schema

Every Asset contains structured governance columns:
*   `source`: Reference origin (e.g. "FIFA Security Directive").
*   `language`: Language code (e.g. "en", "es").
*   `region`: Stadium or territorial region (e.g. "Stadium-A").
*   `audience`: target group (e.g. "Volunteers", "Medical SRE").
*   `confidentiality`: Sensitivity clearance (e.g. "Confidential", "Public").
*   `approval_date`: Timestamp of formal approval.
*   `expiration_date`: Document expiration trigger.
*   `retention_policy`: Data retention parameters.

---

## 3. Asset Lifecycle States

Assets progress through the following timeline:

```text
[Draft] ---> [Submitted] ---> [Under Review] ---> [Approved] ---> [Published]
  ^                                                                  |
  |                                                                  v
  +-------------------( Restore )-------------------- [Archived] <--- [Deprecated]
```

---

## 4. Capability Access Mappings

REST actions are verified using permission-based checks instead of hardcoding role names:

| Actor Header Claim (`x-actor-role`) | Target Permissions |
|---|---|
| `ROLE_ADMIN` | `knowledge:create`, `knowledge:update`, `knowledge:archive`, `knowledge:read` |
| `ROLE_EVENT_COORDINATOR` | `knowledge:update`, `knowledge:read` |
| Other Authenticated Roles | `knowledge:read` |

---

## 5. Duplicate Check Filter

When document files are uploaded, a SHA-256 hash is computed across the binary buffer. If a matching checksum exists in `document_versions.checksum_sha256`, the upload is rejected with a `409 Conflict` (Already Exists) code.

---

## 6. Knowledge Ingestion & Processing Pipeline

Upon successful upload of a new document version, an asynchronous processing job is queued. The processing steps are coordinated by a modular pipeline design:

```text
[Worker] -> [Orchestrator] -> [Parser Registry] -> [Cleaner] -> [Normalizer] -> [Detector] -> [Chunker] -> [Manifest] -> [Store]
```

### Ingestion States:
- `Queued`: Initial state waiting for worker pick up.
- `Downloading`: Retrieving binary payload from the storage port.
- `Parsing`: Extracting raw textual streams via PDF, DOCX, TXT, or MD parsers.
- `Cleaning`: Strip control symbols, normalize bullet indicators, and straighten smart quotes.
- `Normalizing`: Apply NFC Canonical composition and regulate line spacing.
- `Chunking`: Build logical section blocks with hierarchical parent structures and bidirectional sibling pointers.
- `Persisting`: Write chunks and manifest registers to database tables.
- `Completed` / `Failed`: Terminating statuses with error diagnostics.

---

## 7. Logical Chunk Model & Processing Manifest

### Logical Chunk Fields:
- `id`: Unique UUID.
- `processed_document_id`: Reference to document manifest.
- `chunk_index`: 0-indexed position.
- `text`: Normalised block text.
- `section_title` / `parent_section`: Heading descriptors.
- `heading_level`: Markdown heading depth.
- `previous_chunk_id` / `next_chunk_id`: Sibling references.

### Processing Manifest:
Every finished document saves a manifest in `processed_documents` logging:
- `parser_used`: resolved format parser (PDF | DOCX | Markdown | TXT).
- `detected_language`: derived language (English | French | Spanish | Arabic | Hindi).
- `chunk_count`, `character_count`, `word_count`.
- `checksum_sha256`: verification hash.
- `duration_ms`: SRE execution time.
- `warnings`: JSON-serialized list of pipeline warnings.

