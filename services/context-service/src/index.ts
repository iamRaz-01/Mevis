import http from "node:http";
import * as path from "node:path";
import * as fs from "node:fs";
import { loadServiceConfig, loadDatabaseConfig } from "@mevis/infrastructure-configuration";
import { StructuredLogger } from "@mevis/logger";
import { extractContext } from "@mevis/platform-communication";
import { SqliteDatabaseAdapter, SqlMigrationRunner } from "@mevis/platform-data";
import { type StandardResponse, type StandardError } from "@mevis/platform-contracts";

import { 
  WorldEntityRepository, 
  WorldRelationshipRepository,
  WorldIngestedEventRepository,
  WorldLatestStateRepository,
  WorldStateHistoryRepository,
  WorldSnapshotRepository,
  ContextPackageRepository,
  ContextSituationRepository,
  ContextValidationRepository,
  DigitalTwinSnapshotRepository,
  DecisionCandidateRepository,
  DecisionAnalysisRepository,
  DecisionPackageRepository,
  TrustedDecisionRepository,
  DecisionRuntimeStateRepository,
  DecisionSnapshotRepository,
  type WorldEntityEntity,
  type WorldRelationshipEntity
} from "./repository";

import { 
  WorldModelOrchestrator,
  type WorldEntityRepoPort,
  type WorldRelationshipRepoPort
} from "./world/orchestrator";

import { 
  type WorldEntity, 
  type WorldRelationship, 
  type TimelineConfig 
} from "./world/context";

import { HierarchyEngine } from "./world/hierarchy";
import { WorldStateStore, type StateStoreRepoPort } from "./state/store";
import { SnapshotEngine, type SnapshotRepoPort } from "./state/snapshot";
import { StateSynchronizer, type EntityCheckPort } from "./state/synchronizer";

import { ContextBuilder, type ContextSourceReaderPort } from "./context/builder";
import { 
  ContextPackageBuilder, 
  type ContextPackageRepoPort, 
  type ContextSituationRepoPort 
} from "./context/package-builder";
import { type ContextGraph } from "./context/context";
import { ValidationOrchestrator, type ContextValidationRepoPort } from "./validation/orchestrator";

import { DigitalTwinRegistry } from "./twin/registry";
import { DigitalTwinBuilder, type TwinSourceReaderPort } from "./twin/builder";
import { TwinQueryEngine } from "./twin/query";
import { SubscriptionManager } from "./twin/subscription";
import { SnapshotManager, type TwinSnapshotRepoPort } from "./twin/snapshot";
import { PlaybackService, type TwinSnapshotReaderPort } from "./twin/playback";
import { globalEventBus } from "./world/event-bus";

import { DecisionRegistry, type DecisionRegistryRepoPort } from "./decision/registry";
import { DecisionDetectionEngine } from "./decision/detection";
import { DecisionBuilder } from "./decision/builder";
import { DecisionContextBuilder } from "./decision/context-builder";
import { ConstraintBuilder } from "./decision/constraint";
import { DecisionManifestBuilder } from "./decision/manifest";
import { type DecisionCandidate } from "./decision/context";

import { ReasoningOrchestrator, type DecisionAnalysisRepoPort } from "./reasoning/orchestrator";
import { type DecisionAnalysis } from "./reasoning/context";

import { DecisionPackageBuilder, type DecisionPackageRepoPort } from "./recommendation/package-builder";
import { type DecisionPackage } from "./recommendation/context";

import { DecisionValidationOrchestrator, type TrustedDecisionRepoPort } from "./governance/orchestrator";
import { type TrustedDecision } from "./governance/context";

import { ApprovalManager, type DecisionRuntimeStateRepoPort } from "./runtime/approval-manager";
import { HistoryManager } from "./runtime/history-manager";
import { SnapshotService, type DecisionSnapshotRepoPort } from "./runtime/snapshot-service";
import { PlaybackManager } from "./runtime/playback-manager";
import { SubscriptionManager as DecisionSubscriptionManager } from "./runtime/subscription-manager";
import { type DecisionRuntimeState, type DecisionLifecycleState } from "./runtime/context";

const logger = new StructuredLogger("ContextService");
const serviceConfig = loadServiceConfig("context-service");
const dbConfig = loadDatabaseConfig();

const PORT = serviceConfig.port || 3008;
const DB_FILE = dbConfig.url || path.join(process.cwd(), "mevis.db");

// Initialize relational DB adapter
const dbClient = new SqliteDatabaseAdapter(DB_FILE);

const entityRepo = new WorldEntityRepository(dbClient);
const relationshipRepo = new WorldRelationshipRepository(dbClient);

// Map relational ports for Orchestrator
const entityRepoPort: WorldEntityRepoPort = {
  saveEntity: async (entity) => {
    await entityRepo.save(entity);
  },
  findEntityById: async (id) => {
    return await entityRepo.findById(id);
  },
  findAllEntities: async () => {
    return await entityRepo.findAll();
  }
};

const relationshipRepoPort: WorldRelationshipRepoPort = {
  saveRelationship: async (rel) => {
    await relationshipRepo.save(rel);
  },
  findRelationshipById: async (id) => {
    return await relationshipRepo.findById(id);
  },
  findAllRelationships: async () => {
    return await relationshipRepo.findAll();
  }
};

const orchestrator = new WorldModelOrchestrator(entityRepoPort, relationshipRepoPort);
const hierarchyEngine = new HierarchyEngine();

const ingestedEventRepo = new WorldIngestedEventRepository(dbClient);
const latestStateRepo = new WorldLatestStateRepository(dbClient);
const stateHistoryRepo = new WorldStateHistoryRepository(dbClient);
const snapshotRepo = new WorldSnapshotRepository(dbClient);

const stateStoreRepoPort: StateStoreRepoPort = {
  saveLatestState: async (state) => {
    await latestStateRepo.save(state);
  },
  findLatestStateByEntityId: async (entityId) => {
    return await latestStateRepo.findById(entityId);
  },
  findAllLatestStates: async () => {
    return await latestStateRepo.findAll();
  },
  saveHistoryRecord: async (record) => {
    await stateHistoryRepo.save(record);
  },
  findHistoryByEntityId: async (entityId) => {
    return await stateHistoryRepo.findByEntityId(entityId);
  },
  hasIngestedEvent: async (eventId) => {
    const row = await ingestedEventRepo.findById(eventId);
    return !!row;
  },
  saveIngestedEvent: async (event) => {
    await ingestedEventRepo.save(event);
  }
};

const snapshotRepoPort: SnapshotRepoPort = {
  saveSnapshot: async (snapshot) => {
    await snapshotRepo.save(snapshot);
  },
  findSnapshotById: async (id) => {
    return await snapshotRepo.findById(id);
  },
  findAllSnapshots: async () => {
    return await snapshotRepo.findAll();
  }
};

const entityCheckerPort: EntityCheckPort = {
  entityExists: async (entityId) => {
    const ent = await entityRepo.findById(entityId);
    return !!ent;
  }
};

const stateStore = new WorldStateStore(stateStoreRepoPort);
const snapshotEngine = new SnapshotEngine(snapshotRepoPort);
const stateSynchronizer = new StateSynchronizer(stateStore, entityCheckerPort, snapshotEngine);

const contextPackageRepo = new ContextPackageRepository(dbClient);
const contextSituationRepo = new ContextSituationRepository(dbClient);

const contextSourceReaderPort: ContextSourceReaderPort = {
  loadWorldEntities: async () => {
    return await entityRepo.findAll();
  },
  loadLatestStates: async () => {
    return await stateStore.getAllLatestStates();
  }
};

const contextPackageRepoPort: ContextPackageRepoPort = {
  savePackage: async (pkg) => {
    await contextPackageRepo.save(pkg);
  }
};

const contextSituationRepoPort: ContextSituationRepoPort = {
  saveSituation: async (sit) => {
    await contextSituationRepo.save(sit);
  }
};

const contextBuilder = new ContextBuilder(contextSourceReaderPort);
const contextPackageBuilder = new ContextPackageBuilder(contextBuilder, contextPackageRepoPort, contextSituationRepoPort);

const contextValidationRepo = new ContextValidationRepository(dbClient);
const contextValidationRepoPort: ContextValidationRepoPort = {
  saveValidation: async (val) => {
    await contextValidationRepo.save(val);
  }
};
const validationOrchestrator = new ValidationOrchestrator(contextValidationRepoPort);

const twinSnapshotRepo = new DigitalTwinSnapshotRepository(dbClient);
const twinSnapshotRepoPort: TwinSnapshotRepoPort & TwinSnapshotReaderPort = {
  save: async (snap) => {
    await twinSnapshotRepo.save(snap);
  },
  findById: async (id) => {
    return await twinSnapshotRepo.findById(id);
  }
};

const twinSourceReaderPort: TwinSourceReaderPort = {
  loadWorldEntities: async () => {
    return await entityRepo.findAll();
  },
  loadWorldRelationships: async () => {
    return await relationshipRepo.findAll();
  }
};

const twinRegistry = new DigitalTwinRegistry();
const twinBuilder = new DigitalTwinBuilder(twinSourceReaderPort, twinRegistry);
const twinQueryEngine = new TwinQueryEngine(twinRegistry);
const subscriptionManager = new SubscriptionManager(globalEventBus);
const snapshotManager = new SnapshotManager(twinSnapshotRepoPort);
const playbackService = new PlaybackService(twinSnapshotRepoPort, twinRegistry);

const decisionCandidateRepo = new DecisionCandidateRepository(dbClient);
const decisionRegistryRepoPort: DecisionRegistryRepoPort = {
  save: async (dec) => {
    await decisionCandidateRepo.save(dec);
  },
  findAll: async () => {
    return await decisionCandidateRepo.findAll();
  }
};

const decisionRegistry = new DecisionRegistry(decisionRegistryRepoPort);
const decisionDetectionEngine = new DecisionDetectionEngine();
const decisionBuilder = new DecisionBuilder();
const decisionContextBuilder = new DecisionContextBuilder();
const constraintBuilder = new ConstraintBuilder();
const decisionManifestBuilder = new DecisionManifestBuilder();

const decisionAnalysisRepo = new DecisionAnalysisRepository(dbClient);
const decisionAnalysisRepoPort: DecisionAnalysisRepoPort = {
  save: async (anal) => {
    await decisionAnalysisRepo.save(anal);
  }
};
const reasoningOrchestrator = new ReasoningOrchestrator(decisionAnalysisRepoPort);

const decisionPackageRepo = new DecisionPackageRepository(dbClient);
const decisionPackageRepoPort: DecisionPackageRepoPort = {
  save: async (pkg) => {
    await decisionPackageRepo.save(pkg);
  }
};
const decisionPackageBuilder = new DecisionPackageBuilder(decisionPackageRepoPort);

const trustedDecisionRepo = new TrustedDecisionRepository(dbClient);
const trustedDecisionRepoPort: TrustedDecisionRepoPort = {
  save: async (td) => {
    await trustedDecisionRepo.save(td);
  }
};

const engagedResourceChecker = {
  loadEngagedResources: async () => {
    return [];
  }
};
const decisionValidationOrchestrator = new DecisionValidationOrchestrator(
  engagedResourceChecker,
  trustedDecisionRepoPort
);

const decisionRuntimeStateRepo = new DecisionRuntimeStateRepository(dbClient);
const decisionRuntimeStateRepoPort: DecisionRuntimeStateRepoPort = {
  save: async (state) => {
    await decisionRuntimeStateRepo.save(state);
  },
  findById: async (id) => {
    return await decisionRuntimeStateRepo.findById(id);
  }
};

const decisionSnapshotRepo = new DecisionSnapshotRepository(dbClient);
const decisionSnapshotRepoPort: DecisionSnapshotRepoPort = {
  save: async (snap) => {
    await decisionSnapshotRepo.save(snap);
  }
};

const approvalManager = new ApprovalManager(decisionRuntimeStateRepoPort);
const historyManager = new HistoryManager(decisionRuntimeStateRepo);
const snapshotService = new SnapshotService(decisionSnapshotRepoPort);
const playbackManager = new PlaybackManager();
const decisionSubscriptionManager = new DecisionSubscriptionManager();

// Helper to write JSON HTTP responses
function sendJson(
  res: http.ServerResponse,
  status: number,
  data?: any,
  errors?: readonly StandardError[]
): void {
  const success = status >= 200 && status < 300;
  const responsePayload: StandardResponse<any> = {
    success,
    data,
    errors: errors || undefined,
  };
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(responsePayload));
}

// Helper to read incoming JSON request streams
function readJson(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function getPermissions(role: string | undefined): Set<string> {
  const perms = new Set<string>();
  if (!role) return perms;

  if (role.includes("ROLE_ADMIN")) {
    perms.add("world:read");
    perms.add("world:write");
  }
  if (role.includes("ROLE_USER") || role.includes("ROLE_VOLUNTEER") || role.length > 0) {
    perms.add("world:read");
  }
  return perms;
}

function hasPermission(role: string | undefined, requiredPerm: string): boolean {
  return getPermissions(role).has(requiredPerm);
}

const server = http.createServer(async (req, res) => {
  const ctx = extractContext(req);
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const segments = url.pathname.split("/").filter(Boolean);

  try {
    // GET /api/health
    if (req.method === "GET" && url.pathname === "/api/health") {
      return sendJson(res, 200, { status: "UP", service: "context-service" });
    }

    // POST /api/world/entities - Register a new entity
    if (req.method === "POST" && segments[0] === "api" && segments[1] === "world" && segments[2] === "entities" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:write")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:write permission required." }]);
      }
      const body = (await readJson(req)) as any;
      if (!body.entityType || !body.displayName) {
        return sendJson(res, 400, undefined, [{ code: "INVALID_ARGUMENT", message: "Missing required properties: entityType, displayName." }]);
      }
      const entity = await orchestrator.registerEntity(
        body.entityType,
        body.displayName,
        body.parentEntityId || null,
        body.identityRef || null,
        body.capabilities || [],
        body.timeline,
        body.metadata || {}
      );
      return sendJson(res, 201, entity);
    }

    // POST /api/world/relationships - Create a link between two entities
    if (req.method === "POST" && segments[0] === "api" && segments[1] === "world" && segments[2] === "relationships" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:write")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:write permission required." }]);
      }
      const body = (await readJson(req)) as any;
      if (!body.sourceEntityId || !body.targetEntityId || !body.relationshipType) {
        return sendJson(res, 400, undefined, [{ code: "INVALID_ARGUMENT", message: "Missing required properties: sourceEntityId, targetEntityId, relationshipType." }]);
      }
      const rel = await orchestrator.addRelationship(
        body.sourceEntityId,
        body.targetEntityId,
        body.relationshipType,
        body.metadata || {}
      );
      return sendJson(res, 201, rel);
    }

    // POST /api/world/manifest - Build/rebuild world initialization manifest
    if (req.method === "POST" && segments[0] === "api" && segments[1] === "world" && segments[2] === "manifest" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:write")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:write permission required." }]);
      }
      const manifest = await orchestrator.buildManifest();
      return sendJson(res, 200, manifest);
    }

    // GET /api/world/manifest - Retrieve world manifest statistics
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "world" && segments[2] === "manifest" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const manifest = await orchestrator.buildManifest();
      return sendJson(res, 200, manifest);
    }

    // GET /api/world/entities/:id - Retrieve details of a single entity
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "world" && segments[2] === "entities" && segments[3] && !segments[4]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const id = segments[3];
      const row = await entityRepo.findById(id);
      if (!row) {
        return sendJson(res, 404, undefined, [{ code: "NOT_FOUND", message: `Entity "${id}" not found.` }]);
      }
      let parsedJson: any = {};
      try {
        parsedJson = JSON.parse(row.metadata_json);
      } catch {}
      return sendJson(res, 200, {
        id: row.id,
        entityType: row.entity_type,
        displayName: row.display_name,
        parentEntityId: row.parent_entity_id,
        identityRef: row.identity_ref,
        capabilities: parsedJson.capabilities || [],
        timeline: parsedJson.timeline,
        metadata: parsedJson.metadata || {},
      });
    }

    // GET /api/world/entities - Retrieve list of all registered entities
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "world" && segments[2] === "entities" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const rows = await entityRepo.findAll();
      const list = rows.map(row => {
        let parsedJson: any = {};
        try {
          parsedJson = JSON.parse(row.metadata_json);
        } catch {}
        return {
          id: row.id,
          entityType: row.entity_type,
          displayName: row.display_name,
          parentEntityId: row.parent_entity_id,
          identityRef: row.identity_ref,
          capabilities: parsedJson.capabilities || [],
          timeline: parsedJson.timeline,
          metadata: parsedJson.metadata || {},
        };
      });
      return sendJson(res, 200, list);
    }

    // GET /api/world/relationships - Retrieve list of all entity relationships
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "world" && segments[2] === "relationships" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const rows = await relationshipRepo.findAll();
      const list = rows.map(row => {
        let parsedJson: any = {};
        try {
          parsedJson = JSON.parse(row.metadata_json);
        } catch {}
        return {
          id: row.id,
          sourceEntityId: row.source_entity_id,
          targetEntityId: row.target_entity_id,
          relationshipType: row.relationship_type,
          metadata: parsedJson,
        };
      });
      return sendJson(res, 200, list);
    }

    // GET /api/world/hierarchy - Navigate complete hierarchy tree
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "world" && segments[2] === "hierarchy" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const dbEntities = await entityRepo.findAll();
      const entitiesRecord: Record<string, WorldEntity> = {};
      for (const row of dbEntities) {
        let parsedJson: any = {};
        try {
          parsedJson = JSON.parse(row.metadata_json);
        } catch {}
        entitiesRecord[row.id] = {
          id: row.id,
          entityType: row.entity_type,
          displayName: row.display_name,
          parentEntityId: row.parent_entity_id,
          identityRef: row.identity_ref,
          capabilities: parsedJson.capabilities || [],
          timeline: parsedJson.timeline,
          metadata: parsedJson.metadata || {},
        };
      }

      // Group by parent/children
      const hierarchy: Record<string, string[]> = {};
      for (const ent of Object.values(entitiesRecord)) {
        const parentId = ent.parentEntityId || "ROOT";
        hierarchy[parentId] = hierarchy[parentId] || [];
        hierarchy[parentId].push(ent.id);
      }
      return sendJson(res, 200, hierarchy);
    }

    // GET /api/world/timeline - Retrieve temporal structures of entities
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "world" && segments[2] === "timeline" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const dbEntities = await entityRepo.findAll();
      const list = dbEntities.map(row => {
        let parsedJson: any = {};
        try {
          parsedJson = JSON.parse(row.metadata_json);
        } catch {}
        return {
          id: row.id,
          entityType: row.entity_type,
          timeline: parsedJson.timeline,
        };
      });
      return sendJson(res, 200, list);
    }

    // GET /api/world - Overview of entire structural catalog
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "world" && !segments[2]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const dbEntities = await entityRepo.findAll();
      const dbRelationships = await relationshipRepo.findAll();
      
      const entities = dbEntities.map(row => {
        let parsedJson: any = {};
        try {
          parsedJson = JSON.parse(row.metadata_json);
        } catch {}
        return {
          id: row.id,
          entityType: row.entity_type,
          displayName: row.display_name,
          parentEntityId: row.parent_entity_id,
          identityRef: row.identity_ref,
          capabilities: parsedJson.capabilities || [],
          timeline: parsedJson.timeline,
          metadata: parsedJson.metadata || {},
        };
      });

      const relationships = dbRelationships.map(row => {
        let parsedJson: any = {};
        try {
          parsedJson = JSON.parse(row.metadata_json);
        } catch {}
        return {
          id: row.id,
          sourceEntityId: row.source_entity_id,
          targetEntityId: row.target_entity_id,
          relationshipType: row.relationship_type,
          metadata: parsedJson,
        };
      });

      return sendJson(res, 200, { entities, relationships });
    }

    // POST /api/world/events - Ingest a new operational event
    if (req.method === "POST" && segments[0] === "api" && segments[1] === "world" && segments[2] === "events" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:write")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:write permission required." }]);
      }
      const body = (await readJson(req)) as any;
      const result = await stateSynchronizer.processEvent(body);
      return sendJson(res, 200, result);
    }

    // GET /api/world/events - Retrieve raw ingested events
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "world" && segments[2] === "events" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const rows = await ingestedEventRepo.findAll();
      const list = rows.map(r => ({
        id: r.id,
        entityId: r.entity_id,
        eventType: r.event_type,
        eventTime: r.event_time,
        payload: r.payload_json ? JSON.parse(r.payload_json) : {},
        source: r.source,
        version: r.event_version,
        createdAt: r.created_at,
      }));
      return sendJson(res, 200, list);
    }

    // POST /api/world/snapshots - Trigger compilation of a snapshot manually
    if (req.method === "POST" && segments[0] === "api" && segments[1] === "world" && segments[2] === "snapshots" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:write")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:write permission required." }]);
      }
      const allStates = await stateStore.getAllLatestStates();
      const snapshot = await snapshotEngine.takeSnapshot(allStates);
      return sendJson(res, 201, snapshot);
    }

    // GET /api/world/snapshots/:id - Retrieve a snapshot by ID
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "world" && segments[2] === "snapshots" && segments[3] && !segments[4]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const id = segments[3];
      const snapshot = await snapshotEngine.getSnapshot(id);
      if (!snapshot) {
        return sendJson(res, 404, undefined, [{ code: "NOT_FOUND", message: `Snapshot "${id}" not found.` }]);
      }
      return sendJson(res, 200, snapshot);
    }

    // GET /api/world/snapshots - Retrieve list of all snapshots
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "world" && segments[2] === "snapshots" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const snapshots = await snapshotEngine.getAllSnapshots();
      return sendJson(res, 200, snapshots);
    }

    // GET /api/world/history/:entityId - Retrieve state history list for a single entity
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "world" && segments[2] === "history" && segments[3] && !segments[4]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const entityId = segments[3];
      const history = await stateStore.getHistory(entityId);
      return sendJson(res, 200, history);
    }

    // GET /api/world/state/:entityId - Retrieve latest dynamic state of a single entity
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "world" && segments[2] === "state" && segments[3] && !segments[4]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const entityId = segments[3];
      const state = await stateStore.getLatestState(entityId);
      if (!state) {
        return sendJson(res, 404, undefined, [{ code: "NOT_FOUND", message: `State for entity "${entityId}" not found.` }]);
      }
      return sendJson(res, 200, state);
    }

    // GET /api/world/state - Retrieve current dynamic states of all entities
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "world" && segments[2] === "state" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const states = await stateStore.getAllLatestStates();
      return sendJson(res, 200, states);
    }

    // POST /api/context/build - Trigger manual context compilation
    if (req.method === "POST" && segments[0] === "api" && segments[1] === "context" && segments[2] === "build" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:write")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:write permission required." }]);
      }
      const body = (await readJson(req)) as any;
      const limit = typeof body.limit === "number" ? body.limit : 5;
      const result = await contextPackageBuilder.buildContextPackage(limit);
      return sendJson(res, 200, result);
    }

    // GET /api/context/window - Retrieve context window configurations
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "context" && segments[2] === "window" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      return sendJson(res, 200, { maxEntities: 10, defaultLimit: 5 });
    }

    // GET /api/context/graph - Retrieve unified context graph mapping
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "context" && segments[2] === "graph" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const buildRes = await contextPackageBuilder.buildContextPackage(10);
      const pkg = buildRes.pkg;
      
      const nodes: any[] = [];
      const edges: any[] = [];

      for (const fact of pkg.prioritizedFacts) {
        nodes.push({
          id: fact.entityId,
          label: fact.description,
          type: "FACT",
          provenance: fact.provenance,
        });
      }

      for (const rel of pkg.contextualRelationships) {
        edges.push({
          source: rel.sourceId,
          target: rel.targetId,
          relationship: rel.relationshipType,
          explanation: rel.explanation,
        });
      }

      const graph: ContextGraph = { nodes, edges };
      return sendJson(res, 200, graph);
    }

    // GET /api/context/situations - Retrieve active situations list
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "context" && segments[2] === "situations" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const rows = await contextSituationRepo.findAll();
      const list = rows.map(r => ({
        situationId: r.id,
        title: r.title,
        severity: r.severity,
        status: r.status,
        entitiesInvolved: r.entities_involved ? JSON.parse(r.entities_involved) : [],
        createdAt: r.created_at,
      }));
      return sendJson(res, 200, list);
    }

    // GET /api/context/packages - Retrieve list of all compiled context packages
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "context" && segments[2] === "packages" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const rows = await contextPackageRepo.findAll();
      const list = rows.map(r => ({
        id: r.id,
        situationId: r.situation_id,
        data: r.package_data_json ? JSON.parse(r.package_data_json) : {},
        manifest: r.manifest_json ? JSON.parse(r.manifest_json) : {},
        createdAt: r.created_at,
      }));
      return sendJson(res, 200, list);
    }

    // GET /api/context/:id - Retrieve single package details
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "context" && segments[2] && !segments[3]) {
      const id = segments[2];
      if (["validated", "quality", "conflicts", "confidence", "manifests", "window", "graph", "packages", "situations"].includes(id)) {
        // Skip dynamic fallback to allow static sub-route matching
      } else {
        if (!hasPermission(ctx.actorRole, "world:read")) {
          return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
        }
        const row = await contextPackageRepo.findById(id);
        if (!row) {
          return sendJson(res, 404, undefined, [{ code: "NOT_FOUND", message: `Context Package "${id}" not found.` }]);
        }
        return sendJson(res, 200, {
          id: row.id,
          situationId: row.situation_id,
          data: row.package_data_json ? JSON.parse(row.package_data_json) : {},
          manifest: row.manifest_json ? JSON.parse(row.manifest_json) : {},
          createdAt: row.created_at,
        });
      }
    }

    // GET /api/context/validated - Retrieve list of all validated trusted context packages
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "context" && segments[2] === "validated" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const rows = await contextValidationRepo.findAll();
      const list = rows.filter((r: any) => r.health_status === "TRUSTED").map((r: any) => ({
        packageId: r.id,
        healthStatus: r.health_status,
        healthScore: r.health_score,
        manifest: r.manifest_json ? JSON.parse(r.manifest_json) : {},
        createdAt: r.created_at,
      }));
      return sendJson(res, 200, list);
    }

    // GET /api/context/validated/:id - Retrieve validation health status of a single package by ID
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "context" && segments[2] === "validated" && segments[3] && !segments[4]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const id = segments[3];
      const row = await contextValidationRepo.findById(id);
      if (!row) {
        return sendJson(res, 404, undefined, [{ code: "NOT_FOUND", message: `Validation results for package "${id}" not found.` }]);
      }
      return sendJson(res, 200, {
        packageId: row.id,
        healthStatus: row.health_status,
        healthScore: row.health_score,
        manifest: row.manifest_json ? JSON.parse(row.manifest_json) : {},
        createdAt: row.created_at,
      });
    }

    // GET /api/context/quality - Expose latest validation quality stats
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "context" && segments[2] === "quality" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const rows = await contextValidationRepo.findAll();
      const list = rows.map((r: any) => {
        const manifest = r.manifest_json ? JSON.parse(r.manifest_json) : {};
        return {
          packageId: r.id,
          qualityScore: manifest.qualityScore,
          explainableFactors: manifest.explainableFactors || [],
        };
      });
      return sendJson(res, 200, list);
    }

    // GET /api/context/conflicts - Expose list of conflicts identified
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "context" && segments[2] === "conflicts" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const rows = await contextValidationRepo.findAll();
      const conflicts = rows.flatMap((r: any) => {
        const manifest = r.manifest_json ? JSON.parse(r.manifest_json) : {};
        return (manifest.conflictsFound || []).map((c: string) => ({
          packageId: r.id,
          conflict: c,
        }));
      });
      return sendJson(res, 200, conflicts);
    }

    // GET /api/context/confidence - Expose confidence score details
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "context" && segments[2] === "confidence" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const rows = await contextValidationRepo.findAll();
      const list = rows.map((r: any) => {
        const manifest = r.manifest_json ? JSON.parse(r.manifest_json) : {};
        return {
          packageId: r.id,
          confidenceScore: manifest.confidenceScore,
          explainableFactors: manifest.explainableFactors || [],
        };
      });
      return sendJson(res, 200, list);
    }

    // GET /api/context/manifests - Retrieve validation audit manifests log history
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "context" && segments[2] === "manifests" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const rows = await contextValidationRepo.findAll();
      const manifests = rows.map((r: any) => r.manifest_json ? JSON.parse(r.manifest_json) : {});
      return sendJson(res, 200, manifests);
    }

    // POST /api/context/validate - Manually evaluate a context package
    if (req.method === "POST" && segments[0] === "api" && segments[1] === "context" && segments[2] === "validate" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:write")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:write permission required." }]);
      }
      const body = (await readJson(req)) as any;
      if (!body.packageId) {
        return sendJson(res, 400, undefined, [{ code: "INVALID_ARGUMENT", message: "Missing required property: packageId." }]);
      }
      const pkgRow = await contextPackageRepo.findById(body.packageId);
      if (!pkgRow) {
        return sendJson(res, 404, undefined, [{ code: "NOT_FOUND", message: `Context Package "${body.packageId}" not found.` }]);
      }
      const pkg = pkgRow.package_data_json ? JSON.parse(pkgRow.package_data_json) : {};
      const health = await validationOrchestrator.validateContextPackage(pkg);
      return sendJson(res, 200, health);
    }

    // GET /api/context/current - Expose current validated context
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "context" && segments[2] === "current" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const buildRes = await contextPackageBuilder.buildContextPackage(5);
      const health = await validationOrchestrator.validateContextPackage(buildRes.pkg);
      return sendJson(res, 200, { pkg: buildRes.pkg, health });
    }

    // GET /api/context - Get latest compiled and validated Context Package
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "context" && !segments[2]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const buildRes = await contextPackageBuilder.buildContextPackage(5);
      const health = await validationOrchestrator.validateContextPackage(buildRes.pkg);
      return sendJson(res, 200, { pkg: buildRes.pkg, health });
    }

    // GET /api/twin/entities/:id - Retrieve single active entity with current state
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "twin" && segments[2] === "entities" && segments[3] && !segments[4]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const id = segments[3];
      const twin = twinRegistry.getTwinContext();
      if (!twin || !twin.entities[id]) {
        return sendJson(res, 404, undefined, [{ code: "NOT_FOUND", message: `Active twin entity "${id}" not found.` }]);
      }
      return sendJson(res, 200, twin.entities[id]);
    }

    // GET /api/twin/entities - List active entities in the Twin
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "twin" && segments[2] === "entities" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const twin = twinRegistry.getTwinContext();
      if (!twin) {
        return sendJson(res, 200, {});
      }
      return sendJson(res, 200, twin.entities);
    }

    // GET /api/twin/situations - List validated active situations
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "twin" && segments[2] === "situations" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const twin = twinRegistry.getTwinContext();
      if (!twin) {
        return sendJson(res, 200, []);
      }
      return sendJson(res, 200, twin.activeSituations);
    }

    // GET /api/twin/context - Retrieve unified active context details
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "twin" && segments[2] === "context" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const twin = twinRegistry.getTwinContext();
      if (!twin) {
        return sendJson(res, 200, null);
      }
      return sendJson(res, 200, twin.validatedContext);
    }

    // GET /api/twin/graph - Retrieve current complete graph mapping
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "twin" && segments[2] === "graph" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const twin = twinRegistry.getTwinContext();
      if (!twin) {
        return sendJson(res, 200, { nodes: [], edges: [] });
      }
      const nodes = Object.values(twin.entities).map(e => ({
        id: e.id,
        label: e.displayName,
        type: e.entityType,
      }));
      const edges = twin.relationships.map(r => ({
        source: r.sourceId,
        target: r.targetId,
        relationship: r.relationshipType,
      }));
      return sendJson(res, 200, { nodes, edges });
    }

    // GET /api/twin/history - List generated snapshots
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "twin" && segments[2] === "history" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const rows = await twinSnapshotRepo.findAll();
      const list = rows.map((r: any) => ({
        id: r.id,
        createdAt: r.created_at,
      }));
      return sendJson(res, 200, list);
    }

    // GET /api/twin/snapshots - Generate a new snapshot manually
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "twin" && segments[2] === "snapshots" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const twin = twinRegistry.getTwinContext();
      if (!twin) {
        return sendJson(res, 400, undefined, [{ code: "INVALID_STATE", message: "No active Digital Twin context to snapshot." }]);
      }
      const snapshotId = await snapshotManager.createTwinSnapshot(twin);
      return sendJson(res, 200, { snapshotId });
    }

    // POST /api/twin/playback/replay - Replay a historical snapshot
    if (req.method === "POST" && segments[0] === "api" && segments[1] === "twin" && segments[2] === "playback" && segments[3] === "replay" && !segments[4]) {
      if (!hasPermission(ctx.actorRole, "world:write")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:write permission required." }]);
      }
      const body = (await readJson(req)) as any;
      if (!body.snapshotId) {
        return sendJson(res, 400, undefined, [{ code: "INVALID_ARGUMENT", message: "Missing required property: snapshotId." }]);
      }
      const twin = await playbackService.replaySnapshot(body.snapshotId);
      return sendJson(res, 200, twin);
    }

    // GET /api/twin/query/nearest-volunteers - Custom query endpoint for nearest medical responders
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "twin" && segments[2] === "query" && segments[3] === "nearest-volunteers" && !segments[4]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const lat = parseFloat(url.searchParams.get("lat") || "0");
      const lng = parseFloat(url.searchParams.get("lng") || "0");
      const limit = parseInt(url.searchParams.get("limit") || "3", 10);

      const result = twinQueryEngine.queryNearestMedicalVolunteers([lat, lng], limit);
      return sendJson(res, 200, result);
    }

    // GET /api/twin/query/incidents - Custom query for active incidents
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "twin" && segments[2] === "query" && segments[3] === "incidents" && !segments[4]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const result = twinQueryEngine.queryCurrentIncidents();
      return sendJson(res, 200, result);
    }

    // GET /api/twin/query/evacuation-routes - Custom query for open evacuation paths
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "twin" && segments[2] === "query" && segments[3] === "evacuation-routes" && !segments[4]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const result = twinQueryEngine.queryOpenEvacuationRoutes();
      return sendJson(res, 200, result);
    }

    // GET /api/twin - Retrieve current Digital Twin overview context
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "twin" && !segments[2]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const buildRes = await contextPackageBuilder.buildContextPackage(5);
      const health = await validationOrchestrator.validateContextPackage(buildRes.pkg);
      const twin = await twinBuilder.rebuildTwin({ pkg: buildRes.pkg, health });
      await subscriptionManager.dispatch(twin);
      return sendJson(res, 200, twin);
    }

    // GET /api/decisions/types - Retrieve list of all configurable decision categories
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "decisions" && segments[2] === "types" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      return sendJson(res, 200, [
        "Volunteer Assignment",
        "Medical Response",
        "Emergency Escalation",
        "Resource Allocation",
        "Access Control",
        "Evacuation",
        "Crowd Management",
        "Equipment Dispatch",
        "Security Response",
        "Communication Broadcast"
      ]);
    }

    // GET /api/decisions/registry - Retrieve decision registry metrics statistics
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "decisions" && segments[2] === "registry" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const rows = await decisionCandidateRepo.findAll();
      return sendJson(res, 200, {
        totalRegisteredDecisions: rows.length,
        types: [...new Set(rows.map((r: any) => r.decision_type))],
      });
    }

    // GET /api/decisions/manifests - Retrieve history logs of generated manifests
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "decisions" && segments[2] === "manifests" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const rows = await decisionCandidateRepo.findAll();
      const manifests = rows.map((r: any) => r.manifest_json ? JSON.parse(r.manifest_json) : {});
      return sendJson(res, 200, manifests);
    }

    // GET /api/decisions/context/:id - Retrieve decision context object by candidate ID
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "decisions" && segments[2] === "context" && segments[3] && !segments[4]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const id = segments[3];
      const row = await decisionCandidateRepo.findById(id);
      if (!row) {
        return sendJson(res, 404, undefined, [{ code: "NOT_FOUND", message: `Decision candidate "${id}" not found.` }]);
      }
      const parsedCtx = row.context_json ? JSON.parse(row.context_json) : {};
      return sendJson(res, 200, parsedCtx);
    }

    // POST /api/decisions/build - Trigger manual compilation of Decision Candidates from Digital Twin
    if (req.method === "POST" && segments[0] === "api" && segments[1] === "decisions" && segments[2] === "build" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:write")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:write permission required." }]);
      }
      
      const buildRes = await contextPackageBuilder.buildContextPackage(5);
      const health = await validationOrchestrator.validateContextPackage(buildRes.pkg);
      const twin = await twinBuilder.rebuildTwin({ pkg: buildRes.pkg, health });
      
      const detectedList = decisionDetectionEngine.detectDecisions(twin);
      const builtList: DecisionCandidate[] = [];

      for (const det of detectedList) {
        const outline = decisionBuilder.buildDecisionOutline(det.type);
        const dctx = decisionContextBuilder.buildDecisionContext(twin);
        const constraints = constraintBuilder.buildConstraints(twin);

        const candidate: DecisionCandidate = {
          id: outline.id!,
          decisionType: det.type,
          lifecycleState: "Ready For Reasoning",
          context: dctx,
          constraints,
          manifest: null,
          createdAt: outline.createdAt!,
        };

        const manifest = decisionManifestBuilder.buildManifest(candidate);
        const finalCandidate = { ...candidate, manifest };
        
        const registered = await decisionRegistry.registerDecision(finalCandidate);
        if (registered) {
          builtList.push(finalCandidate);
        }
      }

      return sendJson(res, 200, builtList);
    }

    // GET /api/decisions/:id - Retrieve details of a single Decision Candidate and State by ID
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "decisions" && segments[2] && !segments[3]) {
      const id = segments[2];
      if (["types", "registry", "manifests", "context", "build", "pending", "approved", "rejected", "history", "timeline", "playback"].includes(id)) {
        // Skip fallback; match static route
      } else {
        if (!hasPermission(ctx.actorRole, "world:read")) {
          return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
        }
        const row = await decisionCandidateRepo.findById(id);
        if (!row) {
          return sendJson(res, 404, undefined, [{ code: "NOT_FOUND", message: `Decision candidate "${id}" not found.` }]);
        }
        const stateRow = await decisionRuntimeStateRepo.findById(id);
        const state = stateRow ? {
          lifecycleState: stateRow.lifecycle_state,
          approver: stateRow.approver,
          reviewedAt: stateRow.reviewed_at,
          timeline: stateRow.timeline_json ? JSON.parse(stateRow.timeline_json) : [],
          updatedAt: stateRow.updated_at,
        } : null;

        return sendJson(res, 200, {
          id: row.id,
          decisionType: row.decision_type,
          lifecycleState: state ? state.lifecycleState : row.lifecycle_state,
          context: row.context_json ? JSON.parse(row.context_json) : {},
          constraints: row.constraints_json ? JSON.parse(row.constraints_json) : {},
          manifest: row.manifest_json ? JSON.parse(row.manifest_json) : {},
          createdAt: row.created_at,
          runtimeState: state,
        });
      }
    }

    // GET /api/decisions - List registered Decision Candidates and authoritative states
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "decisions" && !segments[2]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const rows = await decisionCandidateRepo.findAll();
      const stateRows = await decisionRuntimeStateRepo.findAll();
      
      const list: any[] = [];
      const addedIds = new Set<string>();

      for (const s of stateRows) {
        const candidate = rows.find((r: any) => r.id === s.id);
        list.push({
          id: s.id,
          decisionType: candidate ? candidate.decision_type : "Medical Response",
          lifecycleState: s.lifecycle_state,
          approver: s.approver,
          reviewedAt: s.reviewed_at,
          createdAt: candidate ? candidate.created_at : s.updated_at,
          updatedAt: s.updated_at,
        });
        addedIds.add(s.id);
      }

      for (const r of rows) {
        if (!addedIds.has(r.id)) {
          list.push({
            id: r.id,
            decisionType: r.decision_type,
            lifecycleState: r.lifecycle_state,
            approver: null,
            reviewedAt: null,
            createdAt: r.created_at,
            updatedAt: r.created_at,
          });
        }
      }

      return sendJson(res, 200, list);
    }

    // GET /api/reasoning/traces - Retrieve explainable reasoning traces
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "reasoning" && segments[2] === "traces" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const rows = await decisionAnalysisRepo.findAll();
      const traces = rows.map((r: any) => r.reasoning_trace_json ? JSON.parse(r.reasoning_trace_json) : {});
      return sendJson(res, 200, traces);
    }

    // GET /api/reasoning/risks - Retrieve list of assessed risk factors
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "reasoning" && segments[2] === "risks" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const rows = await decisionAnalysisRepo.findAll();
      const allRisks: any[] = [];
      for (const row of rows) {
        const parsed = row.analysis_data_json ? JSON.parse(row.analysis_data_json) : {};
        if (parsed.risks) allRisks.push(...parsed.risks);
      }
      return sendJson(res, 200, allRisks);
    }

    // GET /api/reasoning/evidence - Retrieve list of supporting evidence logs
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "reasoning" && segments[2] === "evidence" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const rows = await decisionAnalysisRepo.findAll();
      const allEvidence: any[] = [];
      for (const row of rows) {
        const parsed = row.analysis_data_json ? JSON.parse(row.analysis_data_json) : {};
        if (parsed.evidence) allEvidence.push(...parsed.evidence);
      }
      return sendJson(res, 200, allEvidence);
    }

    // GET /api/reasoning/policies - Retrieve list of loaded organizational policies
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "reasoning" && segments[2] === "policies" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const rows = await decisionAnalysisRepo.findAll();
      const allPolicies: any[] = [];
      for (const row of rows) {
        const parsed = row.analysis_data_json ? JSON.parse(row.analysis_data_json) : {};
        if (parsed.policies) allPolicies.push(...parsed.policies);
      }
      return sendJson(res, 200, allPolicies);
    }

    // POST /api/reasoning/analyze - Run reasoning analysis engine for Decision Candidate ID
    if (req.method === "POST" && segments[0] === "api" && segments[1] === "reasoning" && segments[2] === "analyze" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:write")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:write permission required." }]);
      }
      const body = await readJson(req);
      const decId = body.decisionId;
      if (!decId) {
        return sendJson(res, 400, undefined, [{ code: "BAD_REQUEST", message: "Missing decisionId property." }]);
      }
      const decRow = await decisionCandidateRepo.findById(decId);
      if (!decRow) {
        return sendJson(res, 404, undefined, [{ code: "NOT_FOUND", message: `Decision candidate "${decId}" not found.` }]);
      }

      const candidate: DecisionCandidate = {
        id: decRow.id,
        decisionType: decRow.decision_type,
        lifecycleState: decRow.lifecycle_state as any,
        context: decRow.context_json ? JSON.parse(decRow.context_json) : {},
        constraints: decRow.constraints_json ? JSON.parse(decRow.constraints_json) : {},
        manifest: decRow.manifest_json ? JSON.parse(decRow.manifest_json) : {},
        createdAt: decRow.created_at,
      };

      const analysis = await reasoningOrchestrator.runAnalysis(candidate);
      return sendJson(res, 200, analysis);
    }

    // GET /api/reasoning/:id - Retrieve single Decision Analysis properties
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "reasoning" && segments[2] && !segments[3]) {
      const id = segments[2];
      if (["traces", "risks", "evidence", "policies", "analyze"].includes(id)) {
        // Skip fallback; match static route
      } else {
        if (!hasPermission(ctx.actorRole, "world:read")) {
          return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
        }
        const row = await decisionAnalysisRepo.findById(id);
        if (!row) {
          return sendJson(res, 404, undefined, [{ code: "NOT_FOUND", message: `Decision analysis "${id}" not found.` }]);
        }
        const parsed = row.analysis_data_json ? JSON.parse(row.analysis_data_json) : {};
        return sendJson(res, 200, parsed);
      }
    }

    // GET /api/reasoning - List completed Decision Analyses
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "reasoning" && !segments[2]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const rows = await decisionAnalysisRepo.findAll();
      const list = rows.map((r: any) => {
        const parsed = r.analysis_data_json ? JSON.parse(r.analysis_data_json) : {};
        return {
          id: r.id,
          decisionId: r.decision_id,
          confidence: parsed.confidence,
          createdAt: r.created_at,
        };
      });
      return sendJson(res, 200, list);
    }

    // GET /api/recommendations/alternatives - Retrieve list of all generated alternatives
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "recommendations" && segments[2] === "alternatives" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const rows = await decisionPackageRepo.findAll();
      const allAlts: any[] = [];
      for (const row of rows) {
        const parsed = row.package_data_json ? JSON.parse(row.package_data_json) : {};
        if (parsed.rankedAlternatives) allAlts.push(...parsed.rankedAlternatives);
      }
      return sendJson(res, 200, allAlts);
    }

    // GET /api/recommendations/priority - Retrieve list of ranked recommendations hierarchy
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "recommendations" && segments[2] === "priority" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const rows = await decisionPackageRepo.findAll();
      const priorityList = rows.map((r: any) => {
        const parsed = r.package_data_json ? JSON.parse(r.package_data_json) : {};
        return {
          decisionId: r.decision_id,
          primary: parsed.primaryRecommendation,
          alternatives: parsed.alternativeRecommendations,
        };
      });
      return sendJson(res, 200, priorityList);
    }

    // GET /api/recommendations/tradeoffs - Summarize tradeoffs compromises logs
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "recommendations" && segments[2] === "tradeoffs" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const rows = await decisionPackageRepo.findAll();
      const allTradeoffs: any[] = [];
      for (const row of rows) {
        const parsed = row.package_data_json ? JSON.parse(row.package_data_json) : {};
        if (parsed.tradeoffs) allTradeoffs.push(...parsed.tradeoffs);
      }
      return sendJson(res, 200, allTradeoffs);
    }

    // POST /api/recommendations/generate - Trigger recommendation package building for a Decision Analysis ID
    if (req.method === "POST" && segments[0] === "api" && segments[1] === "recommendations" && segments[2] === "generate" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:write")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:write permission required." }]);
      }
      const body = await readJson(req);
      const analysisId = body.analysisId;
      if (!analysisId) {
        return sendJson(res, 400, undefined, [{ code: "BAD_REQUEST", message: "Missing analysisId property." }]);
      }
      const analRow = await decisionAnalysisRepo.findById(analysisId);
      if (!analRow) {
        return sendJson(res, 404, undefined, [{ code: "NOT_FOUND", message: `Decision analysis "${analysisId}" not found.` }]);
      }

      const analysis = analRow.analysis_data_json ? JSON.parse(analRow.analysis_data_json) : {};
      const decId = analysis.decisionId;
      const decRow = await decisionCandidateRepo.findById(decId);
      if (!decRow) {
        return sendJson(res, 404, undefined, [{ code: "NOT_FOUND", message: `Decision candidate "${decId}" not found.` }]);
      }

      const candidate = {
        id: decRow.id,
        decisionType: decRow.decision_type,
        lifecycleState: decRow.lifecycle_state,
        context: decRow.context_json ? JSON.parse(decRow.context_json) : {},
        constraints: decRow.constraints_json ? JSON.parse(decRow.constraints_json) : {},
        manifest: decRow.manifest_json ? JSON.parse(decRow.manifest_json) : {},
        createdAt: decRow.created_at,
      };

      const pkg = await decisionPackageBuilder.buildPackage(analysis, candidate);
      return sendJson(res, 200, pkg);
    }

    // GET /api/decision-packages - Helper alias for decision packages overview
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "decision-packages" && !segments[2]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const rows = await decisionPackageRepo.findAll();
      const list = rows.map((r: any) => {
        const parsed = r.package_data_json ? JSON.parse(r.package_data_json) : {};
        return {
          id: r.id,
          decisionId: r.decision_id,
          justification: parsed.justification,
          createdAt: r.created_at,
        };
      });
      return sendJson(res, 200, list);
    }

    // GET /api/recommendations/:id - Retrieve details of a single Decision Package by ID
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "recommendations" && segments[2] && !segments[3]) {
      const id = segments[2];
      if (["alternatives", "priority", "tradeoffs", "generate"].includes(id)) {
        // Skip fallback; match static route
      } else {
        if (!hasPermission(ctx.actorRole, "world:read")) {
          return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
        }
        const row = await decisionPackageRepo.findById(id);
        if (!row) {
          return sendJson(res, 404, undefined, [{ code: "NOT_FOUND", message: `Decision package "${id}" not found.` }]);
        }
        const parsed = row.package_data_json ? JSON.parse(row.package_data_json) : {};
        return sendJson(res, 200, parsed);
      }
    }

    // GET /api/recommendations - List compiled Decision Packages
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "recommendations" && !segments[2]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const rows = await decisionPackageRepo.findAll();
      const list = rows.map((r: any) => {
        const parsed = r.package_data_json ? JSON.parse(r.package_data_json) : {};
        return {
          id: r.id,
          decisionId: r.decision_id,
          justification: parsed.justification,
          createdAt: r.created_at,
        };
      });
      return sendJson(res, 200, list);
    }

    // GET /api/governance/conflicts - Retrieve list of detected conflicts logs
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "governance" && segments[2] === "conflicts" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const rows = await trustedDecisionRepo.findAll();
      const allConflicts: any[] = [];
      for (const row of rows) {
        const parsed = row.decision_data_json ? JSON.parse(row.decision_data_json) : {};
        if (parsed.conflicts) allConflicts.push(...parsed.conflicts);
      }
      return sendJson(res, 200, allConflicts);
    }

    // GET /api/governance/confidence - Retrieve confidence scores metadata factors
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "governance" && segments[2] === "confidence" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const rows = await trustedDecisionRepo.findAll();
      const list = rows.map((r: any) => {
        const parsed = r.decision_data_json ? JSON.parse(r.decision_data_json) : {};
        return {
          trustedDecisionId: r.id,
          confidenceScore: parsed.confidenceScore,
        };
      });
      return sendJson(res, 200, list);
    }

    // GET /api/governance/approval - Retrieve list of assigned approval routes
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "governance" && segments[2] === "approval" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const rows = await trustedDecisionRepo.findAll();
      const list = rows.map((r: any) => {
        const parsed = r.decision_data_json ? JSON.parse(r.decision_data_json) : {};
        return {
          trustedDecisionId: r.id,
          approvalRoute: parsed.approvalRoute,
        };
      });
      return sendJson(res, 200, list);
    }

    // POST /api/governance/validate - Run validation pipeline for a Decision Package ID
    if (req.method === "POST" && segments[0] === "api" && segments[1] === "governance" && segments[2] === "validate" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:write")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:write permission required." }]);
      }
      const body = await readJson(req);
      const pkgId = body.packageId;
      if (!pkgId) {
        return sendJson(res, 400, undefined, [{ code: "BAD_REQUEST", message: "Missing packageId property." }]);
      }
      const pkgRow = await decisionPackageRepo.findById(pkgId);
      if (!pkgRow) {
        return sendJson(res, 404, undefined, [{ code: "NOT_FOUND", message: `Decision package "${pkgId}" not found.` }]);
      }

      const pkg = pkgRow.package_data_json ? JSON.parse(pkgRow.package_data_json) : {};
      const td = await decisionValidationOrchestrator.validatePackage(pkg);
      await approvalManager.requestApproval(td.id);
      return sendJson(res, 200, td);
    }

    // GET /api/trusted-decisions - Helper alias for trusted decisions overview
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "trusted-decisions" && !segments[2]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const rows = await trustedDecisionRepo.findAll();
      const list = rows.map((r: any) => {
        const parsed = r.decision_data_json ? JSON.parse(r.decision_data_json) : {};
        return {
          id: r.id,
          decisionId: r.decision_id,
          confidenceScore: parsed.confidenceScore,
          approvalRoute: parsed.approvalRoute,
          createdAt: r.created_at,
        };
      });
      return sendJson(res, 200, list);
    }

    // GET /api/governance/:id - Retrieve single Trusted Decision properties
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "governance" && segments[2] && !segments[3]) {
      const id = segments[2];
      if (["conflicts", "confidence", "approval", "validate"].includes(id)) {
        // Skip fallback; match static route
      } else {
        if (!hasPermission(ctx.actorRole, "world:read")) {
          return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
        }
        const row = await trustedDecisionRepo.findById(id);
        if (!row) {
          return sendJson(res, 404, undefined, [{ code: "NOT_FOUND", message: `Trusted decision "${id}" not found.` }]);
        }
        const parsed = row.decision_data_json ? JSON.parse(row.decision_data_json) : {};
        return sendJson(res, 200, parsed);
      }
    }

    // GET /api/governance - List compiled Trusted Decisions
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "governance" && !segments[2]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const rows = await trustedDecisionRepo.findAll();
      const list = rows.map((r: any) => {
        const parsed = r.decision_data_json ? JSON.parse(r.decision_data_json) : {};
        return {
          id: r.id,
          decisionId: r.decision_id,
          confidenceScore: parsed.confidenceScore,
          approvalRoute: parsed.approvalRoute,
          createdAt: r.created_at,
        };
      });
      return sendJson(res, 200, list);
    }

    // GET /api/decisions/pending - Retrieve list of decisions awaiting approval
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "decisions" && segments[2] === "pending" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const rows = await decisionRuntimeStateRepo.findAll();
      const list = rows.filter((r: any) => r.lifecycle_state === "PENDING_APPROVAL").map((r: any) => {
        return {
          id: r.id,
          lifecycleState: r.lifecycle_state,
          updatedAt: r.updated_at,
        };
      });
      return sendJson(res, 200, list);
    }

    // GET /api/decisions/approved - Retrieve list of approved decisions
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "decisions" && segments[2] === "approved" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const rows = await decisionRuntimeStateRepo.findAll();
      const list = rows.filter((r: any) => r.lifecycle_state === "APPROVED").map((r: any) => {
        return {
          id: r.id,
          lifecycleState: r.lifecycle_state,
          approver: r.approver,
          reviewedAt: r.reviewed_at,
          updatedAt: r.updated_at,
        };
      });
      return sendJson(res, 200, list);
    }

    // GET /api/decisions/rejected - Retrieve list of rejected decisions
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "decisions" && segments[2] === "rejected" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const rows = await decisionRuntimeStateRepo.findAll();
      const list = rows.filter((r: any) => r.lifecycle_state === "REJECTED").map((r: any) => {
        return {
          id: r.id,
          lifecycleState: r.lifecycle_state,
          approver: r.approver,
          reviewedAt: r.reviewed_at,
          updatedAt: r.updated_at,
        };
      });
      return sendJson(res, 200, list);
    }

    // GET /api/decisions/history - Retrieve changes history timeline
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "decisions" && segments[2] === "history" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const rows = await decisionRuntimeStateRepo.findAll();
      const allHistories: any[] = [];
      for (const row of rows) {
        if (row.timeline_json) {
          const parsed = JSON.parse(row.timeline_json);
          allHistories.push({ decisionId: row.id, timeline: parsed });
        }
      }
      return sendJson(res, 200, allHistories);
    }

    // GET /api/decisions/timeline - Sequence of state transitions
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "decisions" && segments[2] === "timeline" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const rows = await decisionRuntimeStateRepo.findAll();
      const timelineLogs: any[] = [];
      for (const row of rows) {
        if (row.timeline_json) {
          const parsed = JSON.parse(row.timeline_json);
          timelineLogs.push(...parsed);
        }
      }
      return sendJson(res, 200, timelineLogs);
    }

    // GET /api/decisions/playback - Historical playback replaying
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "decisions" && segments[2] === "playback" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "world:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:read permission required." }]);
      }
      const queryParams = new URL(req.url || "", `http://localhost:${PORT}`).searchParams;
      const decisionId = queryParams.get("decisionId");
      if (!decisionId) {
        return sendJson(res, 400, undefined, [{ code: "BAD_REQUEST", message: "Missing decisionId query parameter." }]);
      }
      const timeline = await historyManager.getTimeline(decisionId);
      const replayed = await playbackManager.initiatePlayback(decisionId, timeline);
      return sendJson(res, 200, replayed);
    }

    // POST /api/decisions/:id/approve - Approves a decision
    if (req.method === "POST" && segments[0] === "api" && segments[1] === "decisions" && segments[2] && segments[3] === "approve" && !segments[4]) {
      if (!hasPermission(ctx.actorRole, "world:write")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:write permission required." }]);
      }
      const id = segments[2];
      const body = await readJson(req);
      const approver = body.approver || "Operations Director";
      const result = await approvalManager.approveDecision(id, approver);
      return sendJson(res, 200, result);
    }

    // POST /api/decisions/:id/reject - Rejects a decision
    if (req.method === "POST" && segments[0] === "api" && segments[1] === "decisions" && segments[2] && segments[3] === "reject" && !segments[4]) {
      if (!hasPermission(ctx.actorRole, "world:write")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "world:write permission required." }]);
      }
      const id = segments[2];
      const body = await readJson(req);
      const approver = body.approver || "Operations Director";
      const result = await approvalManager.rejectDecision(id, approver);
      return sendJson(res, 200, result);
    }

    // Handled by unified decisions routes above

    return sendJson(res, 404, undefined, [{ code: "NOT_FOUND", message: "Endpoint not found." }]);
  } catch (err: any) {
    logger.error("Request handling error", { error: err?.message || String(err) });
    return sendJson(res, 500, undefined, [
      { code: "INTERNAL_SERVER_ERROR", message: err?.message || "Server error." },
    ]);
  }
});

// Bootstrap routine
export function bootstrap(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    try {
      const migrationDir = path.resolve(__dirname, "../../migrations");
      if (fs.existsSync(migrationDir)) {
        const runner = new SqlMigrationRunner(dbClient);
        runner.runMigrations(migrationDir).then(() => {
          logger.info("World Model relational database migrations applied successfully.");
          server.listen(PORT, () => {
            logger.info("World Model Platform Service workstation started.", {
              port: PORT,
              databaseFile: DB_FILE,
            });
            resolve();
          });
        }).catch(reject);
      } else {
        server.listen(PORT, () => {
          logger.info("World Model Platform Service workstation started.", {
            port: PORT,
            databaseFile: DB_FILE,
          });
          resolve();
        });
      }
    } catch (err: any) {
      logger.error("Bootstrap execution failure", { error: err?.message || String(err) });
      reject(err);
    }
  });
}

process.on("SIGTERM", async () => {
  logger.info("Received SIGTERM. Cleaning database and shutting down...");
  await dbClient.close();
  server.close(() => {
    process.exit(0);
  });
});

if (process.argv[1]?.endsWith("index.js")) {
  bootstrap();
}

export { server, dbClient, entityRepo, relationshipRepo, orchestrator };
