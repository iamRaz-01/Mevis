import { test, describe, before, after } from "node:test";
import assert from "node:assert";
import http from "node:http";
import * as fs from "node:fs";
import * as path from "node:path";
import { SqliteDatabaseAdapter, SqlMigrationRunner } from "@mevis/platform-data";

const TEST_DB = path.join(__dirname, "test_knowledge.db");
const TEST_STORAGE = path.join(__dirname, "test_uploads");
const PORT = 3020;

// Set env vars globally at file evaluation time
process.env.DB_URL = TEST_DB;
process.env.STORAGE_BASE_PATH = TEST_STORAGE;

describe("Enriched Knowledge Repository End-to-End Tests", () => {
  let server: http.Server;
  let dbClient: SqliteDatabaseAdapter;

  interface TestPayload {
    readonly success?: boolean;
    readonly errors?: ReadonlyArray<{ readonly code: string; readonly message: string }>;
    readonly data?: unknown;
  }

  before(async () => {
    // Setup clean folders and DB
    if (fs.existsSync(TEST_DB)) {
      try { fs.unlinkSync(TEST_DB); } catch {}
    }
    if (fs.existsSync(TEST_STORAGE)) {
      fs.rmSync(TEST_STORAGE, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_STORAGE, { recursive: true });

    // Dynamic import to guarantee env variables are loaded by server configuration
    const serverModule = await import("../src/index.js");
    server = serverModule.server;
    dbClient = serverModule.dbClient;

    // Run migrations
    const migrationDir = path.resolve(__dirname, "../../migrations");
    const runner = new SqlMigrationRunner(dbClient);
    await runner.runMigrations(migrationDir);

    // Start local server
    await new Promise<void>((resolve) => {
      server.listen(PORT, () => {
        resolve();
      });
    });
  });

  after(async () => {
    await dbClient.close();
    await new Promise<void>((resolve) => {
      server.close(() => {
        resolve();
      });
    });
    // Cleanup files
    if (fs.existsSync(TEST_DB)) {
      try { fs.unlinkSync(TEST_DB); } catch {}
    }
    if (fs.existsSync(TEST_STORAGE)) {
      fs.rmSync(TEST_STORAGE, { recursive: true, force: true });
    }
  });

  // Helper fetch request
  async function makeRequest(
    method: string,
    pathname: string,
    body?: unknown,
    headers: Record<string, string> = {}
  ): Promise<{ status: number; payload: TestPayload; rawBody: Buffer; headers: http.IncomingHttpHeaders }> {
    return new Promise((resolve, reject) => {
      const opt = {
        hostname: "localhost",
        port: PORT,
        path: pathname,
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      };

      const req = http.request(opt, (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const raw = Buffer.concat(chunks);
          let parsed: unknown = null;
          try {
            parsed = JSON.parse(raw.toString("utf-8"));
          } catch {}
          resolve({
            status: res.statusCode || 500,
            payload: parsed as TestPayload,
            rawBody: raw,
            headers: res.headers,
          });
        });
      });

      req.on("error", reject);
      if (body) {
        if (Buffer.isBuffer(body)) {
          req.write(body);
        } else {
          req.write(JSON.stringify(body));
        }
      }
      req.end();
    });
  }

  test("1. Reject registration if permission-based check fails", async () => {
    const res = await makeRequest("POST", "/api/assets", {
      id: "know_sop_evac_01",
      title: "Evacuation SOP",
      domain: "Security",
      category: "Security",
      ownerId: "steward-1",
    });

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.payload.success, false);
    const errors = res.payload.errors;
    assert.ok(errors);
    assert.strictEqual(errors[0]?.code, "FORBIDDEN");
  });

  test("2. Successfully register a new Knowledge Asset with full governance metadata", async () => {
    const res = await makeRequest(
      "POST",
      "/api/assets",
      {
        id: "know_sop_evac_01",
        title: "Evacuation SOP",
        domain: "Security",
        category: "Security",
        ownerId: "steward-1",
        tags: ["emergency", "exit", "stadium"],
        source: "FIFA Directive",
        language: "en",
        region: "Stadium-A",
        audience: "Security Personnel",
        confidentiality: "Internal",
        approvalDate: "2026-07-01T12:00:00Z",
        expirationDate: "2027-07-01T12:00:00Z",
        retentionPolicy: "Retain 5 years",
      },
      { "x-actor-role": "ROLE_ADMIN", "x-actor-id": "admin-1" }
    );

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.payload.success, true);
    const data = res.payload.data as { id?: string; lifecycle_state?: string; confidentiality?: string };
    assert.strictEqual(data.id, "know_sop_evac_01");
    assert.strictEqual(data.lifecycle_state, "Draft");
    assert.strictEqual(data.confidentiality, "Internal");
  });

  test("3. Retrieve registered assets and verify tag and category query filtering", async () => {
    const res = await makeRequest("GET", "/api/assets?category=Security&tag=exit", undefined, {
      "x-actor-role": "ROLE_ADMIN",
    });
    assert.strictEqual(res.status, 200);
    const data = res.payload.data as ReadonlyArray<{ id?: string; title?: string }>;
    assert.ok(Array.isArray(data));
    assert.strictEqual(data.length, 1);
    assert.strictEqual(data[0]?.id, "know_sop_evac_01");
  });

  test("4. Modify asset metadata fields", async () => {
    const res = await makeRequest(
      "PUT",
      "/api/assets/know_sop_evac_01/metadata",
      {
        title: "Evacuation SOP Updated Title",
        confidentiality: "Confidential",
      },
      { "x-actor-role": "ROLE_ADMIN" }
    );

    assert.strictEqual(res.status, 200);
    const data = res.payload.data as { title?: string; confidentiality?: string };
    assert.strictEqual(data.title, "Evacuation SOP Updated Title");
    assert.strictEqual(data.confidentiality, "Confidential");
  });

  test("5. Progress asset lifecycle transitions", async () => {
    const res = await makeRequest(
      "POST",
      "/api/assets/know_sop_evac_01/lifecycle",
      { state: "Published" },
      { "x-actor-role": "ROLE_ADMIN" }
    );

    assert.strictEqual(res.status, 200);
    const data = res.payload.data as { lifecycle_state?: string };
    assert.strictEqual(data.lifecycle_state, "Published");
  });

  test("6. Register a document format under the asset", async () => {
    const res = await makeRequest(
      "POST",
      "/api/assets/know_sop_evac_01/documents",
      {
        id: "doc_pdf_01",
        name: "evacuation_plan_pdf",
        mimeType: "application/pdf",
      },
      { "x-actor-role": "ROLE_ADMIN" }
    );

    assert.strictEqual(res.status, 201);
    const data = res.payload.data as { id?: string; name?: string };
    assert.strictEqual(data.id, "doc_pdf_01");
    assert.strictEqual(data.name, "evacuation_plan_pdf");
  });

  test("7. Upload a document file version associated with the document format", async () => {
    const docData = Buffer.from("PDF Mock Binary Contents...");
    const res = await makeRequest(
      "POST",
      "/api/assets/know_sop_evac_01/documents/doc_pdf_01/versions?semver=1.0.0&changelog=InitialRelease",
      docData,
      {
        "x-actor-role": "ROLE_ADMIN",
        "Content-Type": "application/pdf",
      }
    );

    assert.strictEqual(res.status, 201);
    const data = res.payload.data as { semver?: string; file_size?: number; storage_uri?: string };
    assert.strictEqual(data.semver, "1.0.0");
    assert.strictEqual(data.file_size, docData.length);
    assert.ok(data.storage_uri?.startsWith("storage://"));
  });

  test("8. Download specific uploaded version content payload", async () => {
    const res = await makeRequest("GET", "/api/assets/know_sop_evac_01/documents/doc_pdf_01/versions/1.0.0/download", undefined, {
      "x-actor-role": "ROLE_USER",
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.rawBody.toString("utf-8"), "PDF Mock Binary Contents...");
    assert.ok(res.headers["x-checksum-sha256"]);
  });

  test("9. Reject duplicate document versions with the same checksum hash", async () => {
    const docData = Buffer.from("PDF Mock Binary Contents...");
    const res = await makeRequest(
      "POST",
      "/api/assets/know_sop_evac_01/documents/doc_pdf_01/versions?semver=1.0.1&changelog=DuplicateTest",
      docData,
      {
        "x-actor-role": "ROLE_ADMIN",
        "Content-Type": "application/pdf",
      }
    );

    assert.strictEqual(res.status, 409);
    const errors = res.payload.errors;
    assert.ok(errors);
    assert.strictEqual(errors[0]?.code, "ALREADY_EXISTS");
  });

  test("10. Verify Archive and Restore soft-delete routes", async () => {
    // 1. Soft-delete / Archive asset
    const archiveRes = await makeRequest(
      "POST",
      "/api/assets/know_sop_evac_01/archive",
      undefined,
      { "x-actor-role": "ROLE_ADMIN" }
    );
    assert.strictEqual(archiveRes.status, 200);
    const archiveData = archiveRes.payload.data as { lifecycle_state?: string };
    assert.strictEqual(archiveData.lifecycle_state, "Archived");

    // 2. Restore asset
    const restoreRes = await makeRequest(
      "POST",
      "/api/assets/know_sop_evac_01/restore",
      undefined,
      { "x-actor-role": "ROLE_ADMIN" }
    );
    assert.strictEqual(restoreRes.status, 200);
    const restoreData = restoreRes.payload.data as { lifecycle_state?: string };
    assert.strictEqual(restoreData.lifecycle_state, "Draft");
  });

  test("11. Verify document parsing, cleaning, and language detection across formats", async () => {
    const indexModule = await import("../src/index.js");
    indexModule.worker.stop(); // Stop automatic polling

    // Create a new MD document format and upload Markdown text
    const mdReg = await makeRequest(
      "POST",
      "/api/assets/know_sop_evac_01/documents",
      { id: "doc_md_01", name: "evacuation_guide_md", mimeType: "text/markdown" },
      { "x-actor-role": "ROLE_ADMIN" }
    );
    assert.strictEqual(mdReg.status, 201);

    const mdContent = Buffer.from("# Protocolo de Evacuación\n\nEste es el protocolo de evacuación para el uso de voluntarios en la zona.");
    const uploadRes = await makeRequest(
      "POST",
      "/api/assets/know_sop_evac_01/documents/doc_md_01/versions?semver=1.0.0",
      mdContent,
      { "x-actor-role": "ROLE_ADMIN", "Content-Type": "text/markdown" }
    );
    assert.strictEqual(uploadRes.status, 201);
    const verData = uploadRes.payload.data as { id: string };

    // Assert that a processing job has been queued or already picked up
    const jobsList = await indexModule.jobRepo.findByVersionId(verData.id);
    assert.strictEqual(jobsList.length, 1);
    assert.ok(["Queued", "Downloading", "Parsing", "Cleaning", "Normalizing", "Chunking", "Persisting", "Completed"].includes(jobsList[0].status));

    // Wait for the background processing to complete
    let jobStatus = jobsList[0];
    for (let i = 0; i < 20; i++) {
      const updated = await indexModule.jobRepo.findById(jobStatus.id);
      if (updated && (updated.status === "Completed" || updated.status === "Failed")) {
        jobStatus = updated;
        break;
      }
      await new Promise(r => setTimeout(r, 50));
    }
    assert.strictEqual(jobStatus.status, "Completed");

    // Verify Manifest exists and contains expected metadata
    const manifest = await indexModule.processedDocRepo.findByVersionId(verData.id);
    assert.ok(manifest);
    assert.strictEqual(manifest.parser_used, "Markdown");
    assert.strictEqual(manifest.detected_language, "Spanish"); // "para el uso de" matching Spanish stopwords
    assert.strictEqual(manifest.chunk_count, 1);

    // Verify Chunks exists with linkages
    const chunks = await indexModule.chunkRepo.findByVersionId(verData.id);
    assert.strictEqual(chunks.length, 1);
    assert.strictEqual(chunks[0].section_title, "Protocolo de Evacuación");
    assert.strictEqual(chunks[0].language, "Spanish");
    assert.strictEqual(JSON.parse(chunks[0].metadata).parser, "Markdown");
  });

  test("12. Verify hierarchy heading levels and bidirectional sibling references", async () => {
    const indexModule = await import("../src/index.js");
    
    const docReg = await makeRequest(
      "POST",
      "/api/assets/know_sop_evac_01/documents",
      { id: "doc_md_02", name: "structured_md", mimeType: "text/markdown" },
      { "x-actor-role": "ROLE_ADMIN" }
    );
    assert.strictEqual(docReg.status, 201);

    const content = Buffer.from(
      "# Global Heading\n\nFirst paragraph text in global section.\n\n" +
      "## Nested Heading\n\nSecond paragraph text nested under subheader.\n\n" +
      "## Secondary Section\n\nThird paragraph text."
    );

    const uploadRes = await makeRequest(
      "POST",
      "/api/assets/know_sop_evac_01/documents/doc_md_02/versions?semver=1.0.0",
      content,
      { "x-actor-role": "ROLE_ADMIN", "Content-Type": "text/markdown" }
    );
    assert.strictEqual(uploadRes.status, 201);
    const verData = uploadRes.payload.data as { id: string };

    // Wait for the background processing to complete
    const jobs = await indexModule.jobRepo.findByVersionId(verData.id);
    let jobStatus = jobs[0];
    for (let i = 0; i < 20; i++) {
      const updated = await indexModule.jobRepo.findById(jobStatus.id);
      if (updated && (updated.status === "Completed" || updated.status === "Failed")) {
        jobStatus = updated;
        break;
      }
      await new Promise(r => setTimeout(r, 50));
    }
    assert.strictEqual(jobStatus.status, "Completed");

    const chunks = await indexModule.chunkRepo.findByVersionId(verData.id);
    // Should have parsed 3 distinct text sections / chunks
    assert.strictEqual(chunks.length, 3);

    // Assert headings levels
    assert.strictEqual(chunks[0].section_title, "Global Heading");
    assert.strictEqual(chunks[0].heading_level, 1);
    
    assert.strictEqual(chunks[1].section_title, "Nested Heading");
    assert.strictEqual(chunks[1].heading_level, 2);
    assert.strictEqual(chunks[1].parent_section, "Global Heading");

    assert.strictEqual(chunks[2].section_title, "Secondary Section");
    assert.strictEqual(chunks[2].heading_level, 2);
    assert.strictEqual(chunks[2].parent_section, "Global Heading");

    // Assert bidirectional chunk sibling linkages
    assert.strictEqual(chunks[0].previous_chunk_id, null);
    assert.strictEqual(chunks[0].next_chunk_id, chunks[1].id);

    assert.strictEqual(chunks[1].previous_chunk_id, chunks[0].id);
    assert.strictEqual(chunks[1].next_chunk_id, chunks[2].id);

    assert.strictEqual(chunks[2].previous_chunk_id, chunks[1].id);
    assert.strictEqual(chunks[2].next_chunk_id, null);
  });

  test("13. Verify retry endpoints and status query routes", async () => {
    const indexModule = await import("../src/index.js");

    const docReg = await makeRequest(
      "POST",
      "/api/assets/know_sop_evac_01/documents",
      { id: "doc_txt_01", name: "evac_instructions", mimeType: "text/plain" },
      { "x-actor-role": "ROLE_ADMIN" }
    );
    assert.strictEqual(docReg.status, 201);

    const uploadRes = await makeRequest(
      "POST",
      "/api/assets/know_sop_evac_01/documents/doc_txt_01/versions?semver=1.0.0",
      Buffer.from("Normal text document instructions."),
      { "x-actor-role": "ROLE_ADMIN", "Content-Type": "text/plain" }
    );
    assert.strictEqual(uploadRes.status, 201);
    const verData = uploadRes.payload.data as { id: string };

    const jobs = await indexModule.jobRepo.findByVersionId(verData.id);
    const jobId = jobs[0].id;

    // Check status route
    const statusRes = await makeRequest("GET", `/api/processing/jobs/${jobId}`, undefined, {
      "x-actor-role": "ROLE_USER",
    });
    assert.strictEqual(statusRes.status, 200);
    assert.ok(["Queued", "Downloading", "Parsing", "Cleaning", "Normalizing", "Chunking", "Persisting", "Completed"].includes((statusRes.payload.data as { status: string }).status));

    // Fail the job intentionally to test retry
    await indexModule.jobRepo.updateJobStatus(jobId, "Failed", "Simulated error context.");

    // Check status is Failed
    const failedStatusRes = await makeRequest("GET", `/api/processing/jobs/${jobId}`, undefined, {
      "x-actor-role": "ROLE_USER",
    });
    assert.strictEqual((failedStatusRes.payload.data as { status: string }).status, "Failed");

    // Perform retry via POST route
    const retryRes = await makeRequest("POST", `/api/processing/jobs/${jobId}/retry`, undefined, {
      "x-actor-role": "ROLE_ADMIN",
    });
    assert.strictEqual(retryRes.status, 200);
    assert.strictEqual((retryRes.payload.data as { status: string }).status, "Queued");
    assert.strictEqual((retryRes.payload.data as { retry_count: number }).retry_count, 1);

    // Wait for the background processing to complete after retry trigger
    let finalJob = jobs[0];
    for (let i = 0; i < 20; i++) {
      const updated = await indexModule.jobRepo.findById(jobId);
      if (updated && (updated.status === "Completed" || updated.status === "Failed")) {
        finalJob = updated;
        break;
      }
      await new Promise(r => setTimeout(r, 50));
    }
    assert.strictEqual(finalJob.status, "Completed");
    
    // Assert chunks retrieval via GET endpoint
    const chunksRes = await makeRequest("GET", `/api/assets/know_sop_evac_01/chunks?versionId=${verData.id}`, undefined, {
      "x-actor-role": "ROLE_USER",
    });
    assert.strictEqual(chunksRes.status, 200);
    const chunksList = chunksRes.payload.data as any[];
    assert.ok(chunksList.length > 0);
  });

  test("14. Verify general search with query analysis and hybrid strategy scoring", async () => {
    const res = await makeRequest(
      "POST",
      "/api/search",
      { query: "Protocolo de Evacuación" },
      { "x-actor-role": "ROLE_USER" }
    );
    assert.strictEqual(res.status, 200);
    const payload = res.payload.data as any;
    assert.strictEqual(payload.query, "Protocolo de Evacuación");
    assert.ok(Array.isArray(payload.results));
    assert.ok(payload.results.length > 0);

    const firstResult = payload.results[0];
    assert.ok(firstResult.chunkId);
    assert.ok(firstResult.score);
    assert.ok(typeof firstResult.score.overallScore === "number");
    assert.strictEqual(firstResult.strategy, "hybrid");
    assert.strictEqual(firstResult.language, "Spanish");
  });

  test("15. Verify semantic-only search computes similarity metric", async () => {
    const res = await makeRequest(
      "POST",
      "/api/search/semantic",
      { query: "voluntarios" },
      { "x-actor-role": "ROLE_USER" }
    );
    assert.strictEqual(res.status, 200);
    const payload = res.payload.data as any;
    assert.ok(payload.results.length > 0);
    assert.strictEqual(payload.results[0].strategy, "semantic");
    assert.ok(payload.results[0].score.semanticScore > 0);
  });

  test("16. Verify post-retrieval filtering restricts outputs by category and language", async () => {
    // 1. Matching category: Security
    const matchRes = await makeRequest(
      "POST",
      "/api/search",
      {
        query: "Evacuación",
        filters: { category: "Security" },
      },
      { "x-actor-role": "ROLE_USER" }
    );
    assert.strictEqual(matchRes.status, 200);
    assert.ok((matchRes.payload.data as any).results.length > 0);

    // 2. Non-matching category: Medical
    const mismatchRes = await makeRequest(
      "POST",
      "/api/search",
      {
        query: "Evacuación",
        filters: { category: "Medical" },
      },
      { "x-actor-role": "ROLE_USER" }
    );
    assert.strictEqual(mismatchRes.status, 200);
    assert.strictEqual((mismatchRes.payload.data as any).results.length, 0);
  });

  test("17. Verify autocomplete suggestions return expected segment headings", async () => {
    const res = await makeRequest(
      "GET",
      "/api/search/suggestions?query=proto&limit=5",
      undefined,
      { "x-actor-role": "ROLE_USER" }
    );
    assert.strictEqual(res.status, 200);
    const list = res.payload.data as string[];
    assert.ok(Array.isArray(list));
    assert.ok(list.includes("Protocolo de Evacuación"));
  });

  test("18. Verify search cache and invalidation triggers", async () => {
    // 1. Initial query to populate cache
    const res1 = await makeRequest(
      "POST",
      "/api/search",
      { query: "voluntarios" },
      { "x-actor-role": "ROLE_USER" }
    );
    assert.strictEqual(res1.status, 200);
    assert.strictEqual((res1.payload.data as any).metadata.cached, false);

    // 2. Second query should be fetched from cache
    const res2 = await makeRequest(
      "POST",
      "/api/search",
      { query: "voluntarios" },
      { "x-actor-role": "ROLE_USER" }
    );
    assert.strictEqual(res2.status, 200);
    assert.strictEqual((res2.payload.data as any).metadata.cached, true);

    // 3. Trigger processing completed event to clear cache
    const indexModule = await import("../src/index.js");
    indexModule.searchOrchestrator.cache.invalidate();

    // 4. Query again, cache must be empty/invalidated (cached: false)
    const res3 = await makeRequest(
      "POST",
      "/api/search",
      { query: "voluntarios" },
      { "x-actor-role": "ROLE_USER" }
    );
    assert.strictEqual(res3.status, 200);
    assert.strictEqual((res3.payload.data as any).metadata.cached, false);
  });

  test("19. Verify evidence compilation from query produces structured bundles and citations", async () => {
    // Make sure our asset is Published so it is validated as evidence
    await makeRequest(
      "POST",
      "/api/assets/know_sop_evac_01/lifecycle",
      { state: "Published" },
      { "x-actor-role": "ROLE_ADMIN" }
    );

    const res = await makeRequest(
      "POST",
      "/api/evidence",
      { query: "voluntarios" },
      { "x-actor-role": "ROLE_USER" }
    );
    assert.strictEqual(res.status, 200);
    const bundle = res.payload.data as any;
    assert.ok(bundle.id);
    assert.strictEqual(bundle.query, "voluntarios");
    assert.ok(Array.isArray(bundle.items));
    assert.ok(bundle.items.length > 0);

    const item = bundle.items[0];
    assert.ok(item.id);
    assert.ok(item.confidence > 0);
    assert.strictEqual(item.validationStatus, "Valid");
    assert.ok(item.provenance.length > 0);
    
    // Check citation mapping
    const citation = bundle.citations[item.citationId];
    assert.ok(citation);
    assert.strictEqual(citation.assetId, "know_sop_evac_01");

    // Check relationship graph nodes and links structures
    assert.ok(bundle.graph);
    assert.ok(Array.isArray(bundle.graph.nodes));
    assert.ok(Array.isArray(bundle.graph.links));
  });

  test("20. Verify duplicate resolution merges matching text while preserving all provenance sources", async () => {
    const searchResults = [
      {
        chunkId: "chunk_dup_1",
        assetId: "know_sop_evac_01",
        versionId: "ver_dup_1",
        text: "This is a duplicate text chunk.",
        language: "English",
        score: { overallScore: 0.8, keywordScore: 0.8, semanticScore: 0.8, freshnessScore: 0.5, metadataScore: 0.5 },
        strategy: "keyword",
        matchExplanation: "Exact matching",
        metadata: { source: "Doc A", parser: "Markdown", processingVersion: "1.0.0" }
      },
      {
        chunkId: "chunk_dup_2",
        assetId: "know_sop_evac_01",
        versionId: "ver_dup_2",
        text: "This is a duplicate text chunk.", // Identical text
        language: "English",
        score: { overallScore: 0.9, keywordScore: 0.9, semanticScore: 0.9, freshnessScore: 0.5, metadataScore: 0.5 }, // Higher score
        strategy: "semantic",
        matchExplanation: "Cosine match",
        metadata: { source: "Doc B", parser: "Markdown", processingVersion: "1.0.0" }
      }
    ];

    const res = await makeRequest(
      "POST",
      "/api/evidence/compile",
      {
        query: "duplicate text chunk",
        searchResults
      },
      { "x-actor-role": "ROLE_USER" }
    );
    assert.strictEqual(res.status, 200);
    const bundle = res.payload.data as any;
    
    // Merged count: should yield exactly 1 evidence item
    assert.strictEqual(bundle.items.length, 1);
    
    const mergedItem = bundle.items[0];
    // Must contain both provenance source entries
    assert.strictEqual(mergedItem.provenance.length, 2);
    assert.strictEqual(mergedItem.provenance[0].chunkId, "chunk_dup_1");
    assert.strictEqual(mergedItem.provenance[1].chunkId, "chunk_dup_2");
    
    // Check that overall statistics reflects the duplicate merge
    assert.strictEqual(bundle.statistics.itemsCount, 1);
  });

  test("21. Verify retrieve bundle and audit manifest routes by bundle ID", async () => {
    // 1. Compile bundle
    const compileRes = await makeRequest(
      "POST",
      "/api/evidence",
      { query: "voluntarios" },
      { "x-actor-role": "ROLE_USER" }
    );
    const bundleId = (compileRes.payload.data as any).id;
    assert.ok(bundleId);

    // 2. GET bundle by ID
    const getBundleRes = await makeRequest(
      "GET",
      `/api/evidence/${bundleId}`,
      undefined,
      { "x-actor-role": "ROLE_USER" }
    );
    assert.strictEqual(getBundleRes.status, 200);
    assert.strictEqual((getBundleRes.payload.data as any).id, bundleId);

    // 3. GET manifest by ID
    const getManifestRes = await makeRequest(
      "GET",
      `/api/evidence/${bundleId}/manifest`,
      undefined,
      { "x-actor-role": "ROLE_USER" }
    );
    assert.strictEqual(getManifestRes.status, 200);
    const manifest = getManifestRes.payload.data as any;
    assert.strictEqual(manifest.id, bundleId);
    assert.strictEqual(manifest.query, "voluntarios");
    assert.ok(manifest.retrievedCount > 0);
  });

  test("22. Verify validation rejects unapproved assets", async () => {
    // 1. Set lifecycle state to Draft (unapproved)
    await makeRequest(
      "POST",
      "/api/assets/know_sop_evac_01/lifecycle",
      { state: "Draft" },
      { "x-actor-role": "ROLE_ADMIN" }
    );

    // 2. Try compiling evidence
    const res = await makeRequest(
      "POST",
      "/api/evidence",
      { query: "voluntarios" },
      { "x-actor-role": "ROLE_USER" }
    );
    assert.strictEqual(res.status, 200);
    const bundle = res.payload.data as any;
    
    // Valid item count should be 0 because Draft asset was rejected!
    assert.strictEqual(bundle.items.length, 0);
    
    // Statistics should report 1 rejected candidate
    assert.strictEqual(bundle.statistics.rejectedCount, 1);
  });

  test("23. Verify governance policy retrieval exposes configurable compliance thresholds", async () => {
    const res = await makeRequest(
      "GET",
      "/api/governance/policies",
      undefined,
      { "x-actor-role": "ROLE_USER" }
    );
    assert.strictEqual(res.status, 200);
    const rules = res.payload.data as any;
    assert.strictEqual(rules.minQualityScore, 0.5);
    assert.ok(Array.isArray(rules.requiredMetadata));
  });

  test("24. Verify manual single-asset validation resolves deterministic quality, freshness, and explainable health scores", async () => {
    // Re-publish the asset so it is lifecycle valid
    await makeRequest(
      "POST",
      "/api/assets/know_sop_evac_01/lifecycle",
      { state: "Published" },
      { "x-actor-role": "ROLE_ADMIN" }
    );

    const res = await makeRequest(
      "POST",
      "/api/governance/validate",
      { assetId: "know_sop_evac_01" },
      { "x-actor-role": "ROLE_USER" }
    );
    assert.strictEqual(res.status, 200);
    const result = res.payload.data as any;
    assert.strictEqual(result.assetId, "know_sop_evac_01");
    assert.strictEqual(result.valid, true);
    assert.ok(result.qualityScore > 0);
    assert.strictEqual(result.freshnessStatus, "Fresh");
    assert.ok(result.healthScore > 0);
    assert.ok(result.explanation.includes("Health"));
  });

  test("25. Verify global recheck returns manifest details and tracks audit logs in immutable ledger", async () => {
    const res = await makeRequest(
      "POST",
      "/api/governance/recheck",
      {},
      { "x-actor-role": "ROLE_USER" }
    );
    assert.strictEqual(res.status, 200);
    const manifest = res.payload.data as any;
    assert.ok(manifest.executionTimeMs >= 0);
    assert.ok(manifest.assetsEvaluated > 0);
    assert.ok(manifest.averageHealth > 0);

    // Verify audit logs are populated for the asset
    const auditRes = await makeRequest(
      "GET",
      "/api/knowledge/know_sop_evac_01/audit",
      undefined,
      { "x-actor-role": "ROLE_USER" }
    );
    assert.strictEqual(auditRes.status, 200);
    const records = auditRes.payload.data as any;
    assert.ok(Array.isArray(records));
    assert.ok(records.length > 0);
    assert.ok(records.some((r: any) => r.eventType === "HealthScoreUpdated"));
  });

  test("26. Verify stable governed catalog endpoints protect downstream runtimes from raw details", async () => {
    const res = await makeRequest(
      "GET",
      "/api/knowledge",
      undefined,
      { "x-actor-role": "ROLE_USER" }
    );
    assert.strictEqual(res.status, 200);
    const list = res.payload.data as any;
    assert.ok(Array.isArray(list));
    
    const asset = list.find((a: any) => a.id === "know_sop_evac_01");
    assert.ok(asset);
    assert.ok(asset.healthScore > 0);
    assert.ok(asset.qualityScore > 0);
    assert.strictEqual(asset.freshnessStatus, "Fresh");
    assert.strictEqual(asset.policyCompliant, true);
  });

  test("27. Verify duplicate detection flags assets containing identical text chunks", async () => {
    // 1. Register a new version containing duplicate text as evac_01
    await makeRequest(
      "POST",
      "/api/assets",
      {
        id: "know_dup_asset_01",
        title: "Duplicate Asset",
        domain: "Operations",
        category: "Operations",
        ownerId: "owner_admin",
        tags: ["dup"],
        state: "Published",
        source: "Manual",
        language: "es",
        audience: "All",
        confidentiality: "Internal",
        approvalDate: new Date().toISOString(),
      },
      { "x-actor-role": "ROLE_ADMIN" }
    );

    await makeRequest(
      "POST",
      "/api/assets/know_dup_asset_01/lifecycle",
      { state: "Published" },
      { "x-actor-role": "ROLE_ADMIN" }
    );

    // Inject matching database entities and processed chunks into the DB index
    const indexModule = await import("../src/index.js");

    await indexModule.docRepo.save({
      id: "doc_dup_01",
      asset_id: "know_dup_asset_01",
      name: "duplicate.md",
      mime_type: "text/markdown",
      created_at: new Date().toISOString(),
    });

    await indexModule.versionRepo.save({
      id: "ver_dup_copy",
      document_id: "doc_dup_01",
      semver: "1.0.0",
      version_number: 1,
      storage_uri: "storage://dup.md",
      file_size: 100,
      checksum_sha256: "checksum_dup",
      changelog: null,
      parent_version_id: null,
      created_at: new Date().toISOString(),
      created_by: "admin",
    });

    await indexModule.processedDocRepo.save({
      id: "proc_dup_01",
      asset_id: "know_dup_asset_01",
      document_id: "doc_dup_01",
      version_id: "ver_dup_copy",
      parser_used: "Markdown",
      detected_language: "es",
      chunk_count: 1,
      character_count: 50,
      word_count: 7,
      checksum_sha256: "checksum_dup",
      processing_version: "1.0.0",
      duration_ms: 5,
      warnings: "[]",
      processed_at: new Date().toISOString(),
    });

    indexModule.searchIndex.rebuildIndex([
      {
        id: "chunk_evac_orig",
        processed_document_id: "doc_evac_orig",
        asset_id: "know_sop_evac_01",
        version_id: "ver_evac_orig",
        chunk_index: 0,
        text: "Identical duplicate text chunk matching across files.",
        section_title: "S1",
        parent_section: "P1",
        heading_level: 1,
        previous_chunk_id: null,
        next_chunk_id: null,
        language: "es",
        word_count: 7,
        character_count: 50,
        metadata: "{}",
      },
      {
        id: "chunk_dup_copy",
        processed_document_id: "doc_dup_copy",
        asset_id: "know_dup_asset_01",
        version_id: "ver_dup_copy",
        chunk_index: 0,
        text: "Identical duplicate text chunk matching across files.", // Identical text
        section_title: "S1",
        parent_section: "P1",
        heading_level: 1,
        previous_chunk_id: null,
        next_chunk_id: null,
        language: "es",
        word_count: 7,
        character_count: 50,
        metadata: "{}",
      }
    ]);

    // Validate know_dup_asset_01 and verify duplicateFlag is true
    const res = await makeRequest(
      "POST",
      "/api/governance/validate",
      { assetId: "know_dup_asset_01" },
      { "x-actor-role": "ROLE_USER" }
    );
    assert.strictEqual(res.status, 200);
    const result = res.payload.data as any;
    assert.strictEqual(result.duplicateFlag, true);
    assert.ok(result.duplicateDetails.length > 0);
  });
});

