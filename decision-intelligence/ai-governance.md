# AI Governance & Safety Constraints

Defines prompts, safety guards, and version control for AI components.

---

## 1. Model Selection Rules

- Low-risk classification tasks use lightweight models (e.g. Flash models).
- High-risk planning tasks use reasoner models (e.g. Pro models).

## 2. Safety Rollback

- If an LLM prompt update drops safety compliance below 100%, the system MUST automatically rollback to the last stable prompt version.
