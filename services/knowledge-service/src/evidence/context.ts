import { type SearchResult } from "../search/context";
import { type IndexedChunk } from "../search/index-port";

export interface ProvenanceDetails {
  readonly assetId: string;
  readonly versionId: string;
  readonly documentId: string;
  readonly chunkId: string;
  readonly sectionTitle?: string;
  readonly parserUsed: string;
  readonly detectedLanguage: string;
}

export interface CitationDetails {
  readonly assetId: string;
  readonly versionId: string;
  readonly chunkId: string;
  readonly sectionTitle?: string;
  readonly documentTitle: string;
  readonly processingVersion: string;
  readonly retrievalStrategy: string;
  readonly formatted: string;
}

export interface EvidenceItem {
  readonly id: string;
  readonly chunkId: string;
  readonly assetId: string;
  readonly versionId: string;
  readonly sectionTitle?: string;
  readonly excerpt: string;
  readonly confidence: number;
  readonly citationId: string;
  readonly validationStatus: "Valid" | "Rejected";
  readonly ranking: number;
  readonly provenance: readonly ProvenanceDetails[]; // Can have multiple due to duplicate merges!
}

export interface EvidenceLink {
  readonly source: string; // Evidence item ID
  readonly target: string; // Sibling Evidence item ID
  readonly relation: "previous_chunk" | "next_chunk" | "parent_section";
}

export interface EvidenceGraph {
  readonly nodes: readonly EvidenceItem[];
  readonly links: readonly EvidenceLink[];
}

export interface EvidenceManifest {
  readonly id: string; // Matches bundle ID
  readonly query: string;
  readonly executionTimeMs: number;
  readonly retrievedCount: number;
  readonly validatedCount: number;
  readonly rejectedCount: number;
  readonly mergedCount: number;
  readonly evidenceCount: number;
  readonly confidenceAvg: number;
  readonly createdAt: string;
}

export interface EvidenceBundle {
  readonly id: string;
  readonly query: string;
  readonly items: readonly EvidenceItem[];
  readonly citations: Record<string, CitationDetails>;
  readonly confidence: {
    readonly overallConfidence: number;
    readonly explanation: string;
  };
  readonly statistics: {
    readonly itemsCount: number;
    readonly totalWordCount: number;
    readonly rejectedCount: number;
  };
  readonly graph: EvidenceGraph;
  readonly executionMetadata: {
    readonly durationMs: number;
    readonly sourceSearchCandidates: number;
  };
}

export interface CompilationCandidate {
  readonly id: string;
  readonly chunk: IndexedChunk;
  readonly searchScore: number;
  readonly matchingTerms: readonly string[];
  readonly strategy: string;
  
  // Pipeline accumulation states
  validationStatus: "Valid" | "Rejected";
  validationErrors: string[];
  trustworthinessScore: number;
  confidenceScore: number;
  confidenceExplanation: string;
  mergedSources: ProvenanceDetails[];
}

export interface EvidenceContext {
  readonly query: string;
  readonly searchResults: readonly SearchResult[];
  candidates: CompilationCandidate[];
  validated: CompilationCandidate[];
  ranked: CompilationCandidate[];
  bundle: EvidenceBundle | null;
  manifest: EvidenceManifest | null;
}
