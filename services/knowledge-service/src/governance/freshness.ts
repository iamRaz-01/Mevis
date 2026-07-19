import { type PolicyRules } from "./context";

export type FreshnessStatus = "Fresh" | "Review Soon" | "Stale" | "Expired";

export class FreshnessEngine {
  evaluate(asset: any, policy: PolicyRules): FreshnessStatus {
    const approvalStr = asset.approval_date;
    const expirationStr = asset.expiration_date;

    if (!approvalStr) {
      return "Stale";
    }

    const now = Date.now();
    const approvalTime = Date.parse(approvalStr);
    
    // 1. Check expiration date thresholds
    if (expirationStr) {
      const expirationTime = Date.parse(expirationStr);
      if (now > expirationTime) {
        return "Expired";
      }

      // Check review buffer window
      const reviewBufferMs = policy.reviewSoonDays * 24 * 60 * 60 * 1000;
      if (expirationTime - now < reviewBufferMs) {
        return "Review Soon";
      }
    }

    // 2. Age limit checks
    const maxAgeMs = policy.expirationDays * 24 * 60 * 60 * 1000;
    if (now - approvalTime > maxAgeMs) {
      return "Stale";
    }

    return "Fresh";
  }
}
