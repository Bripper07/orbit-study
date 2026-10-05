import { describe, it, expect } from "vitest";
import { createSeed } from "./seed";
import {
  generateDailyTimeline,
  generateStudyRoute,
  compareRoutes,
  routeStart,
} from "./timeline";
const tasks = createSeed().tasks.slice(0, 3);
const start = "2026-10-05T13:30:00.000Z";
describe("timeline diária", () => {
  it("coloca pausa entre tarefas e espaço livre ao final", () => {
    const timeline = generateDailyTimeline(tasks.slice(0, 2), start, 90, 5);
    expect(timeline.map((i) => i.kind)).toEqual([
      "task",
      "break",
      "task",
      "free",
    ]);
    expect(timeline.map((i) => i.minutes)).toEqual([30, 5, 25, 30]);
    expect(timeline[2].startAt).toBe("2026-10-05T14:05:00.000Z");
  });
  it("não ultrapassa o tempo disponível, incluindo pausas", () => {
    const items = generateDailyTimeline(tasks, start, 59, 5);
    expect(items.filter((i) => i.kind === "task")).toHaveLength(1);
    expect(items.reduce((sum, i) => sum + i.minutes, 0)).toBe(59);
  });
  it("gera espaço livre quando não existem tarefas", () =>
    expect(generateDailyTimeline([], start, 60)[0].kind).toBe("free"));
  it("não adiciona pausa ou tempo livre com orçamento exato", () =>
    expect(
      generateDailyTimeline(tasks.slice(0, 1), start, 30).map((i) => i.kind),
    ).toEqual(["task"]));
  it("inclui custo das pausas na seleção e mantém tarefas pendentes no To-do", () => {
    const result = generateStudyRoute(tasks, 59, new Date(2026, 9, 5), [], 5);
    expect(result.plannedMinutes).toBeLessThanOrEqual(59);
    expect(result.today).toHaveLength(1);
    expect(result.later).toHaveLength(2);
  });
  it("respeita adiamentos sem modificar prazo ou entrada", () => {
    const before = JSON.stringify(tasks);
    const result = generateStudyRoute(tasks, 180, new Date(), [tasks[0].id]);
    expect(result.ordered.at(-1)?.id).toBe(tasks[0].id);
    expect(JSON.stringify(tasks)).toBe(before);
  });
  it("identifica mudança de horário no replanejamento", () => {
    const before = generateDailyTimeline(tasks, start, 180);
    const after = generateDailyTimeline(tasks, "2026-10-05T14:00:00Z", 180);
    expect(compareRoutes(before, after).every((c) => c.changed)).toBe(true);
    expect(compareRoutes(before, before).every((c) => !c.changed)).toBe(true);
  });
  it("mantém a data local do início e rejeita datas inválidas", () => {
    const now = new Date(2026, 9, 5);
    expect(new Date(routeStart("10:30", now)).getHours()).toBe(10);
    expect(() => generateDailyTimeline([], "invalid", 60)).toThrow();
  });
});
