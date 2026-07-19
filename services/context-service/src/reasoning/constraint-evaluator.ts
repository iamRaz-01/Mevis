import { type DecisionCandidate } from "../decision/context";

export class ConstraintEvaluator {
  evaluateConstraints(candidate: DecisionCandidate): readonly string[] {
    const list: string[] = [];
    const constraints = candidate.constraints;

    if (constraints) {
      list.push(...(constraints.operational || []));
      list.push(...(constraints.business || []));
      list.push(...(constraints.resource || []));
      list.push(...(constraints.time || []));
      list.push(...(constraints.legal || []));
    }

    return list;
  }
}
