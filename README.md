# Mega Event Volunteer Intelligence System (MEVIS)

MEVIS (Mega Event Volunteer Intelligence System) is an AI-native Cognitive Volunteer Intelligence Platform designed to transform volunteers from passive task executors into context-aware operational collaborators.

The platform continuously observes operational signals, reasons across multiple knowledge sources, recommends explainable actions, and coordinates human decision-making during large-scale events.

---

## 📖 Engineering Documentation Foundation

Before writing application code, we have established a complete engineering documentation foundation that serves as the single source of truth for both human engineers and AI coding agents.

To explore the architecture, specifications, coding standards, and development workflows, navigate to:

👉 **[MEVIS Engineering Documentation Foundation](./docs/README.md)**

---

## 📁 Repository Directory Map

The repository is structured as follows:

```text
/
├── docs/               # System documentation foundation
│   ├── README.md       # Central Docs Index
│   ├── product/        # Product Vision and goals
│   ├── engineering/    # MEVIS Engineering Constitution (MEC)
│   ├── architecture/   # Platform architecture and service specs
│   ├── reasoning/      # Cognitive loop and AI spec
│   ├── adr/            # Architecture Decision Records registry
│   ├── standards/      # Coding, repository, and naming standards
│   └── development/    # Git, branching, and PR workflows
├── domain/             # Canonical state machines, events, and timelines
│   ├── state-models/   # Entity lifecycle state machines (volunteer, incident, etc.)
│   ├── event-model/    # Event taxonomy catalog and Draft-07 schemas
│   ├── timelines/      # Cross-domain operational scenarios (medical, crowd surge, etc.)
│   ├── transition-rules/ # State transition rules YAML constraints
│   ├── simulations/    # Simulation metadata scenario configurations
│   ├── validation/     # Semantic validation scripts (verify_semantics.py)
│   └── diagrams/       # Lifecycle Mermaid statecharts
├── architecture/       # Canonical logical domain partitioning & governance
│   └── domain/         # Bounded contexts, RACI maps, communication, and ACLs
├── decision-intelligence/ # Canonical reasoning pipeline, risk models, and decision contracts
│   ├── examples/       # Traced scenario examples (medical, crowd surge, etc.)
│   ├── simulations/    # Scenario simulation YAML configs (RAG test cases)
│   ├── validation/     # Semantic verification scripts (verify_decision_semantics.py)
│   └── diagrams/       # Pipeline, risk, and lifecycle Mermaid charts
├── ontology/           # Canonical domain ontology, schemas, and graph configurations
│   ├── ontology.md     # Semantic domain ontology catalog
│   ├── schemas/        # JSON schemas for all major entities
│   └── graph/          # Knowledge Graph visualization diagrams (mmd, graphml)
├── .gitignore          # Version control exclusions
└── README.md           # Repository entrypoint (this file)
```

For development guidelines, branching rules, and PR checklist, see **[development/workflow.md](./docs/development/workflow.md)**.
All code must conform to the naming and structure guidelines defined in **[standards/standards.md](./docs/standards/standards.md)**.
