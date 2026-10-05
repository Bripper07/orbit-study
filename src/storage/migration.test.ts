import { expect, it } from "vitest";
import { createSeed } from "../domain/seed";
import { migrateData } from "./repository";
it("migra v1 preservando tarefas, matérias e tema sem inventar histórico", () => {
  const seed = createSeed();
  const { memory, settings, routeStartAt, ...old } = seed;
  void memory;
  void settings;
  void routeStartAt;
  const migrated = migrateData({ ...old, version: 1 });
  expect(migrated.version).toBe(2);
  expect(migrated.tasks).toEqual(seed.tasks);
  expect(migrated.subjects).toEqual(seed.subjects);
  expect(migrated.memory).toEqual({ sessions: [], events: [] });
});
it("aceita sessão com tempo extra e preserva o histórico válido", () => {
  const data = createSeed();
  data.focus = {
    taskId: "1",
    durationSeconds: 60,
    elapsedSeconds: 90,
    runningSince: null,
  };
  expect(migrateData(data)).toEqual(data);
});
it("rejeita memória corrompida e configurações inválidas", () => {
  const data = createSeed();
  expect(() =>
    migrateData({ ...data, memory: { sessions: [{}], events: [] } }),
  ).toThrow();
  expect(() =>
    migrateData({
      ...data,
      settings: { ...data.settings, startTime: "99:00" },
    }),
  ).toThrow();
});
it("rejeita versões desconhecidas e datas que não existem", () => {
  const data = createSeed();
  expect(() => migrateData({ ...data, version: 99 })).toThrow();
  data.tasks[0].dueDate = "2026-02-30";
  expect(() => migrateData(data)).toThrow();
});
