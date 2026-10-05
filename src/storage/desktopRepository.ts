import { isTauri } from "@tauri-apps/api/core";
import type { AppData } from "../types";
import { localRepository, migrateData } from "./repository";
import { createSeed } from "../domain/seed";
export interface AsyncDataRepository {
  load(): Promise<AppData>;
  save(data: AppData): Promise<void>;
}
export async function resolveRepository(): Promise<AsyncDataRepository> {
  if (!isTauri())
    return {
      load: async () => localRepository.load(),
      save: async (data) => localRepository.save(data),
    };
  const { load } = await import("@tauri-apps/plugin-store");
  const store = await load("orbit.json", { autoSave: false, defaults: {} });
  return {
    async load() {
      const value = await store.get<unknown>("data");
      if (value !== undefined) return migrateData(value);
      const legacy = localStorage.getItem("orbit.data.v1");
      return legacy ? migrateData(JSON.parse(legacy)) : createSeed();
    },
    async save(data) {
      await store.set("data", data);
      await store.save();
    },
  };
}
