import { type UserMemory } from "./context";
import crypto from "node:crypto";

export class MemoryManager {
  constructor(private readonly memoryRepo: any) {}

  async addMemory(userId: string, memoryText: string, scope = "USER"): Promise<UserMemory> {
    const id = `mem_${crypto.randomUUID().slice(0, 8)}`;
    const memory: UserMemory = {
      id,
      userId,
      memoryText,
      scope,
      createdAt: new Date().toISOString(),
    };

    await this.memoryRepo.save({
      id: memory.id,
      user_id: memory.userId,
      memory_text: memory.memoryText,
      scope: memory.scope,
      created_at: memory.createdAt,
    });

    return memory;
  }

  async getUserMemories(userId: string): Promise<UserMemory[]> {
    const all = await this.memoryRepo.findAll();
    return all
      .filter((m: any) => m.user_id === userId)
      .map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        memoryText: row.memory_text,
        scope: row.scope,
        createdAt: row.created_at,
      }));
  }
}
