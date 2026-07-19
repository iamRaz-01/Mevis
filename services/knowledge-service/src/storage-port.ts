import {
  LocalStorageAdapter,
  type StoragePort,
} from "@mevis/infrastructure-storage";

export interface KnowledgeStoragePort {
  storeFile(name: string, mimeType: string, content: Buffer): Promise<string>;
  getFile(storageId: string): Promise<{ content: Buffer; mimeType: string; name: string }>;
  exists(storageId: string): Promise<boolean>;
}

export class RelationalStorageAdapter implements KnowledgeStoragePort {
  private readonly adapter: StoragePort;

  constructor(basePath = "./uploads") {
    this.adapter = new LocalStorageAdapter(basePath);
  }

  async storeFile(name: string, mimeType: string, content: Buffer): Promise<string> {
    const meta = await this.adapter.upload({
      originalName: name,
      mimeType,
      content,
    });
    return meta.id;
  }

  async getFile(storageId: string): Promise<{ content: Buffer; mimeType: string; name: string }> {
    const content = await this.adapter.download(storageId);
    const meta = await this.adapter.getMetadata(storageId);
    return {
      content,
      mimeType: meta.mimeType,
      name: meta.originalName,
    };
  }

  async exists(storageId: string): Promise<boolean> {
    return await this.adapter.exists(storageId);
  }
}
