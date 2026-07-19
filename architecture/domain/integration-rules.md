# MEVIS Integration Rules

Defines the allowed vs. forbidden communication rules to protect the architecture from erosion.

---

## 1. Allowed Communications

- **Incident Management** $
ightarrow$ **Context Intelligence** (Publish state change events).
- **Decision Intelligence** $
ightarrow$ **Recommendation Engine** (Send validated decisions).
- **Recommendation Engine** $
ightarrow$ **Notification** (Command to send alerts).

## 2. Forbidden Communications

- **Analytics** $
ightarrow$ **Volunteer Management** (Analytics MUST NOT write/modify volunteer profiles).
- **Notification** $
ightarrow$ **Incident Management** (Notifications MUST NOT change incident state directly).
- **Authentication** $
ightarrow$ **Decision Intelligence** (Authentication context MUST remain decoupled from operational reasoning).
