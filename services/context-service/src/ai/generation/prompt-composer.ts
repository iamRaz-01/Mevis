export class PromptComposer {
  composePrompt(plan: any, packageData?: any): string {
    const stepsText = plan.steps.map((s: any) => `- ${s.description} [Status: ${s.status}]`).join("\n");
    return `System Instruction: Generate response matching execution plan.
Query Intent: ${plan.intent}
Execution Steps:
${stepsText}

Resolved Operational Context:
${packageData ? JSON.stringify(packageData) : "Standard state context"}
`;
  }
}
