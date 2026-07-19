export class IdentityMapping {
  mapIdentity(entityId: string, identityRef: string): { readonly entityId: string; readonly identityRef: string } {
    if (!entityId || !identityRef) {
      throw new Error("Both world Entity ID and Identity reference must be provided.");
    }
    return {
      entityId,
      identityRef,
    };
  }
}
