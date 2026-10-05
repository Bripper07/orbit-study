import { expect, it } from "vitest";
import { createSeed } from "./seed";
import { getInsights } from "./insights";
import type { FocusRecord, MemoryEvent } from "../types";
const event = (id: string, kind: MemoryEvent["kind"]): MemoryEvent => ({
  id,
  kind,
  taskId: "1",
  subjectId: "python",
  occurredAt: new Date().toISOString(),
});
it("não inventa percepções com dados vazios ou poucas observações", () => {
  const data = createSeed();
  expect(getInsights(data)).toEqual([]);
  data.memory.events = [event("a", "stuck"), event("b", "deferred")];
  expect(getInsights(data)).toEqual([]);
});
it("mostra adiamentos apenas depois de três registros", () => {
  const data = createSeed();
  data.memory.events = Array.from({ length: 3 }, (_, i) =>
    event(String(i), "deferred"),
  );
  expect(getInsights(data)[0].text).toContain("3 vezes");
});
it("mostra uso do debugger depois de quatro registros", () => {
  const data = createSeed();
  data.memory.events = Array.from({ length: 4 }, (_, i) =>
    event(String(i), "stuck"),
  );
  expect(getInsights(data)[0].id).toBe("stuck-python");
});
it("exige cinco tarefas distintas para inferir subestimativa", () => {
  const data = createSeed();
  data.memory.events = Array.from({ length: 5 }, (_, i) => ({
    ...event(String(i), "completed"),
    taskId: String(i),
    estimatedMinutes: 30,
    actualSeconds: 2400,
  }));
  expect(getInsights(data)[0].id).toBe("estimate-python");
  data.memory.events = data.memory.events.map((e) => ({
    ...e,
    taskId: "same",
  }));
  expect(getInsights(data)).toEqual([]);
});
it("exige oito sessões para descrever o período predominante", () => {
  const data = createSeed();
  const record: FocusRecord = {
    id: "1",
    taskId: "1",
    taskTitle: "Estudar",
    subjectId: "python",
    startedAt: new Date(2026, 9, 5, 9).toISOString(),
    endedAt: new Date(2026, 9, 5, 10).toISOString(),
    actualSeconds: 1800,
    plannedSeconds: 1800,
    outcome: "completed",
  };
  data.memory.sessions = Array.from({ length: 7 }, (_, i) => ({
    ...record,
    id: String(i),
  }));
  expect(getInsights(data)).toEqual([]);
  data.memory.sessions.push({ ...record, id: "8" });
  expect(getInsights(data)[0].text).toContain("pela manhã");
});
it("não declara um horário predominante com distribuição equilibrada", () => {
  const data = createSeed();
  data.memory.sessions = Array.from({ length: 9 }, (_, i) => ({
    id: String(i),
    taskId: "1",
    taskTitle: "Teste",
    subjectId: "python",
    startedAt: new Date(2026, 9, 5, [9, 15, 21][i % 3]).toISOString(),
    endedAt: new Date().toISOString(),
    actualSeconds: 100,
    plannedSeconds: 100,
    outcome: "completed",
  }));
  expect(getInsights(data)).toEqual([]);
});
