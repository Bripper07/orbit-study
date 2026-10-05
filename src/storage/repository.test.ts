import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { localRepository } from "./repository";
import { createSeed } from "../domain/seed";
let saved: string | null;
beforeEach(() => {
  saved = null;
  vi.stubGlobal("localStorage", {
    getItem: () => saved,
    setItem: (_key: string, value: string) => {
      saved = value;
    },
  });
});
afterEach(() => vi.unstubAllGlobals());
it("carrega exemplo somente quando não existem dados", () => {
  expect(localRepository.load().tasks.length).toBeGreaterThan(0);
  expect(saved).toBeNull();
});
it("preserva tarefas e sessão no armazenamento", () => {
  const data = createSeed();
  data.focus = {
    taskId: "1",
    durationSeconds: 600,
    elapsedSeconds: 50,
    runningSince: null,
  };
  localRepository.save(data);
  expect(localRepository.load()).toEqual(data);
});
it("não troca um conjunto vazio salvo pelo exemplo", () => {
  const data = createSeed();
  data.tasks = [];
  localRepository.save(data);
  expect(localRepository.load().tasks).toEqual([]);
});
it("rejeita dados corrompidos sem sobrescrevê-los", () => {
  saved = '{"version":1,"tasks":[]}';
  expect(() => localRepository.load()).toThrow();
  expect(saved).toBe('{"version":1,"tasks":[]}');
});
it("reinicia apenas a ordem adiada quando muda o dia", () => {
  const data = createSeed();
  data.planDate = "2020-01-01";
  data.deferredIds = ["1"];
  localRepository.save(data);
  const loaded = localRepository.load();
  expect(loaded.deferredIds).toEqual([]);
  expect(loaded.tasks).toEqual(data.tasks);
});
