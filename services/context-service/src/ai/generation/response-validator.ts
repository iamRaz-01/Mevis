export class ResponseValidator {
  validateResponse(text: string): { isValid: boolean; reason?: string } {
    if (!text || text.length < 5) {
      return { isValid: false, reason: "Response text too short." };
    }
    if (text.includes("[Hallucination]") || text.includes("unverified source")) {
      return { isValid: false, reason: "Hallucination indicator detected." };
    }
    return { isValid: true };
  }
}
