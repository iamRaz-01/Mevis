import { type CompilationCandidate } from "./context";

export class ConfidenceEngine {
  assess(candidate: CompilationCandidate): { score: number; explanation: string } {
    const searchWeight = 0.5;
    const trustWeight = 0.3;
    const validationWeight = 0.2;

    const valFactor = candidate.validationStatus === "Valid" ? 1.0 : 0.0;
    
    const calculatedScore = 
      (candidate.searchScore * searchWeight) + 
      (candidate.trustworthinessScore * trustWeight) + 
      (valFactor * validationWeight);

    const explanation = `Weight breakdown: Search Relevance (${candidate.searchScore.toFixed(2)} * 50%), ` +
      `Source Trustworthiness (${candidate.trustworthinessScore.toFixed(2)} * 30%), ` +
      `Validation Status (${candidate.validationStatus === "Valid" ? "1.0" : "0.0"} * 20%).`;

    return {
      score: parseFloat(calculatedScore.toFixed(3)),
      explanation,
    };
  }
}
