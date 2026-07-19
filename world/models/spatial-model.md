# Spatial Hierarchy Specification

Defines physical space and navigation layouts within the stadium.

---

## 1. Spatial Tree

```text
Venue (Lusail Stadium)
    └── Stadium Sector (North, East, West, South)
          ├── Zone (Concourse Block B)
          │     ├── Gate (Entry Gate B12)
          │     └── Pathway (Exit Corridor 4)
          └── Medical Station (First Aid North Tunnel)
```

## 2. Navigational Adjacency

Every zone specifies adjacency mapping lists to compute routing pathways for volunteers.
