import { type SearchFilters } from "./context";
import { type RetrievalCandidate } from "./retriever/registry";

export interface FilterAssetMetadata {
  readonly id: string;
  readonly category: string;
  readonly ownerId: string;
  readonly lifecycleState: string;
  readonly tags: readonly string[];
}

export interface FilterEngineRepoPort {
  getAssetMetadataList(assetIds: string[]): Promise<Record<string, FilterAssetMetadata>>;
}

export class FilterEngine {
  constructor(private readonly repoPort: FilterEngineRepoPort) {}

  async filter(candidates: readonly RetrievalCandidate[], filters: SearchFilters | undefined): Promise<readonly RetrievalCandidate[]> {
    if (!filters || Object.keys(filters).length === 0) {
      return candidates;
    }

    const assetIds = Array.from(new Set(candidates.map(c => c.chunk.asset_id)));
    if (assetIds.length === 0) return [];

    // Bulk retrieve metadata mapping to bypass individual DB reads
    const assetMetaMap = await this.repoPort.getAssetMetadataList(assetIds);

    return candidates.filter(candidate => {
      const chunk = candidate.chunk;
      const assetMeta = assetMetaMap[chunk.asset_id];

      // If asset metadata is missing, filter candidate out as safe default
      if (!assetMeta) return false;

      // 1. Filter by category
      if (filters.category && filters.category.toLowerCase() !== assetMeta.category.toLowerCase()) {
        return false;
      }

      // 2. Filter by ownerId
      if (filters.ownerId && filters.ownerId !== assetMeta.ownerId) {
        return false;
      }

      // 3. Filter by lifecycleState
      if (filters.lifecycleState && filters.lifecycleState.toLowerCase() !== assetMeta.lifecycleState.toLowerCase()) {
        return false;
      }

      // 4. Filter by language (can match chunk language or filters language setting)
      if (filters.language && filters.language.toLowerCase() !== chunk.language.toLowerCase()) {
        return false;
      }

      // 5. Filter by assetId
      if (filters.assetId && filters.assetId !== chunk.asset_id) {
        return false;
      }

      // 6. Filter by tags list (asset must contain all specified filter tags)
      if (filters.tags && filters.tags.length > 0) {
        const assetTagsLower = assetMeta.tags.map(t => t.toLowerCase());
        const hasAllTags = filters.tags.every(t => assetTagsLower.includes(t.toLowerCase()));
        if (!hasAllTags) {
          return false;
        }
      }

      return true;
    });
  }
}
