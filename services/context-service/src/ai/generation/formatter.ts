export class ResponseFormatter {
  format(text: string, formatType: string): string {
    if (formatType === "JSON") {
      return JSON.stringify({ response: text, formatted: true });
    }
    if (formatType === "Briefing") {
      return `=== MEVIS Shift Briefing ===\n${text}\n===========================`;
    }
    return text;
  }
}
