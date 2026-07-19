# Context Hierarchy Specification

Defines containment, inheritance, and parent-child aggregation rules for Context scopes.

---

## 1. Containment Chain

Context inherits rules hierarchically from parent contexts:

```text
Global Context
   └── Venue Context (Stadium)
         └── Zone Context (Concourse North)
               └── Incident Context (Local Incident #204)
                     └── Volunteer Context (Assigned Responder)
```

## 2. Inheritance Rules

- Child contexts MUST inherit constraints from parent levels (e.g. Venue evacuation plans override Zone task assignments).
- Aggregation MUST remain acyclic; child nodes cannot act as parents of superior nodes.
