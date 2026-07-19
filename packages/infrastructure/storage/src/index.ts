// ─────────────────────────────────────────────────────────────────────────────
// @mevis/infrastructure-storage
// Reusable file storage abstraction. Hides local FS / cloud object storage
// behind a stable port interface so consuming services never depend on the
// underlying provider.
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export interface FileMetadata {
  readonly id: string;
  readonly originalName: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly storagePath: string;
  readonly uploadedAt: string; // ISO-8601
}

export interface UploadRequest {
  readonly originalName: string;
  readonly mimeType: string;
  readonly content: Buffer;
}

export interface StoragePort {
  upload(request: UploadRequest): Promise<FileMetadata>;
  download(id: string): Promise<Buffer>;
  getMetadata(id: string): Promise<FileMetadata>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}

export class FileNotFoundError extends StorageError {
  constructor(id: string) {
    super(`File with id "${id}" not found in storage.`);
    this.name = 'FileNotFoundError';
  }
}

/**
 * Local filesystem storage adapter.
 * Implements StoragePort using the local disk under a configurable base path.
 * Swap for an S3/GCS adapter without changing any consumer code.
 */
export class LocalStorageAdapter implements StoragePort {
  private readonly metaDir: string;
  private readonly dataDir: string;

  constructor(private readonly basePath: string = './uploads') {
    this.metaDir = path.join(basePath, '.meta');
    this.dataDir = path.join(basePath, 'data');
  }

  private async ensureDirs(): Promise<void> {
    await fs.mkdir(this.metaDir, { recursive: true });
    await fs.mkdir(this.dataDir, { recursive: true });
  }

  private metaPath(id: string): string {
    return path.join(this.metaDir, `${id}.json`);
  }

  private dataPath(id: string): string {
    return path.join(this.dataDir, id);
  }

  async upload(request: UploadRequest): Promise<FileMetadata> {
    await this.ensureDirs();

    const id = crypto.randomUUID();
    const metadata: FileMetadata = {
      id,
      originalName: request.originalName,
      mimeType: request.mimeType,
      sizeBytes: request.content.byteLength,
      storagePath: this.dataPath(id),
      uploadedAt: new Date().toISOString(),
    };

    await fs.writeFile(this.dataPath(id), request.content);
    await fs.writeFile(this.metaPath(id), JSON.stringify(metadata, null, 2));

    return metadata;
  }

  async download(id: string): Promise<Buffer> {
    try {
      return await fs.readFile(this.dataPath(id));
    } catch {
      throw new FileNotFoundError(id);
    }
  }

  async getMetadata(id: string): Promise<FileMetadata> {
    try {
      const raw = await fs.readFile(this.metaPath(id), 'utf-8');
      return JSON.parse(raw) as FileMetadata;
    } catch {
      throw new FileNotFoundError(id);
    }
  }

  async delete(id: string): Promise<void> {
    const exists = await this.exists(id);
    if (!exists) throw new FileNotFoundError(id);
    await Promise.all([
      fs.rm(this.dataPath(id), { force: true }),
      fs.rm(this.metaPath(id), { force: true }),
    ]);
  }

  async exists(id: string): Promise<boolean> {
    try {
      await fs.access(this.dataPath(id));
      return true;
    } catch {
      return false;
    }
  }
}
