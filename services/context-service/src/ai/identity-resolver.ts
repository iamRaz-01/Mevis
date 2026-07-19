import { StructuredLogger } from "@mevis/logger";

const logger = new StructuredLogger("IdentityResolver");

export class IdentityResolver {
  constructor(private readonly volunteerRepo: any) {}

  async resolveIdentity(userId: string): Promise<{ userId: string; role: string }> {
    const vol = await this.volunteerRepo.findById(userId);
    if (!vol) {
      logger.info(`User ID "${userId}" not found in volunteers list. Defaulting role to ROLE_USER.`);
      return { userId, role: "ROLE_USER" };
    }
    
    let role = "ROLE_USER";
    if (vol.email.includes("admin")) {
      role = "ROLE_ADMIN";
    } else if (vol.email.includes("supervisor") || vol.email.includes("coordinator") || vol.email.includes("carlos")) {
      role = "ROLE_COORDINATOR";
    }

    logger.info(`Resolved identity for ${userId} with role ${role}`);
    return { userId, role };
  }
}
