import { type ReasoningGraph } from "./context";

export class GraphBuilder {
  buildGraph(steps: ReadonlyArray<any>): ReasoningGraph {
    const nodes = steps.map((s, idx) => ({
      id: `step_${idx}`,
      label: s.description,
    }));

    const edges = [];
    for (let i = 0; i < steps.length - 1; i++) {
      edges.push({
        from: `step_${i}`,
        to: `step_${i + 1}`,
      });
    }

    return { nodes, edges };
  }
}
