# MEVIS Bounded Context Map

This document defines upstream/downstream dependencies and ACL patterns across MEVIS.

---

## 1. Upstream/Downstream Context Mappings

- **Volunteer Management (Upstream)** $
ightarrow$ **Context Intelligence (Downstream)** [Customer-Supplier]
- **Incident Management (Upstream)** $
ightarrow$ **Context Intelligence (Downstream)** [Customer-Supplier]
- **Context Intelligence (Upstream)** $
ightarrow$ **Decision Intelligence (Downstream)** [Published Language]
- **Knowledge Management (Upstream)** $
ightarrow$ **Decision Intelligence (Downstream)** [Shared Kernel]
- **Decision Intelligence (Upstream)** $
ightarrow$ **Recommendation Engine (Downstream)** [Customer-Supplier]
- **Recommendation Engine (Upstream)** $
ightarrow$ **Notification (Downstream)** [Customer-Supplier]
- **Volunteer Management (Upstream)** $
ightarrow$ **Analytics (Downstream)** [Anti-Corruption Layer]
