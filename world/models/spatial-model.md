# Spatial Hierarchy & Semantics Specification

Defines physical space, navigation layouts, and visibility rules within the stadium.

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

---

## 2. Spatial Semantics

### 2.1 Adjacency Mapping

Zones are connected via directional adjacency links (e.g. `Gate B12` is adjacent to `Concourse B`). Adjacency dictates physical walking paths.

### 2.2 Visibility Fields

Cameras and posts define visibility polygons. An incident occurring outside visibility polygons requires physical steward validation dispatches.

### 2.3 Reachability Metrics

Reachability defines estimated volunteer travel time (seconds) between any two zones based on current crowd density maps:
\[ T_{\text{travel}} = D \cdot (1 + \beta \cdot \text{Density}) \]
