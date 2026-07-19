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
