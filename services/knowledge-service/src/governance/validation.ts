export interface ValidationDetails {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

export class ValidationEngine {
  validate(
    asset: any, 
    documents: readonly any[], 
    versions: readonly any[], 
    manifests: readonly any[]
  ): ValidationDetails {
    const errors: string[] = [];

    // 1. Structural fields check
    if (!asset.id || !asset.title || !asset.category || !asset.owner_id) {
      errors.push("Missing core asset properties (id, title, category, owner_id).");
    }

    // 2. Lifecycle status authorization check
    if (asset.lifecycle_state !== "Approved" && asset.lifecycle_state !== "Published") {
      errors.push(`Asset lifecycle state is non-authoritative: "${asset.lifecycle_state}".`);
    }

    // 3. Processing completion checks
    if (documents.length === 0) {
      errors.push("No document formats associated with asset.");
    } else {
      let hasManifest = false;
      for (const doc of documents) {
        const docVersions = versions.filter(v => v.document_id === doc.id);
        for (const ver of docVersions) {
          const found = manifests.some(m => m.version_id === ver.id);
          if (found) {
            hasManifest = true;
            break;
          }
        }
        if (hasManifest) break;
      }
      if (!hasManifest) {
        errors.push("Missing successfully processed document manifests.");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
