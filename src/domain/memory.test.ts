import { it, expect } from "vitest";
import { createSeed } from "./seed";
import {
  archiveFocus,
  completeTask,
  deferTask,
  memoryEvent,
  usedStudyMinutes,
} from "./memory";
const now = new Date(2026, 9, 5, 10, 40);
function active() {
  const data = createSeed();
  data.routeStartAt = new Date(2026, 9, 5, 10, 0).toISOString();
  data.focus = {
    id: "session",
    taskId: "1",
    startedAt: new Date(2026, 9, 5, 10, 0).toISOString(),
    durationSeconds: 1800,
    elapsedSeconds: 0,
    runningSince: new Date(2026, 9, 5, 10, 0).getTime(),
  };
  return data;
}
it("registra duração planejada e duração real sem limitar o tempo extra", () => {
  const result = archiveFocus(active(), "completed", now);
  expect(result.focus).toBeNull();
  expect(result.memory.sessions[0].plannedSeconds).toBe(1800);
  expect(result.memory.sessions[0].actualSeconds).toBe(2400);
});
it("concluir registra sessão, tarefa e informação para estimativas", () => {
  const data = active();
  const result = completeTask(data, "1", now);
  expect(result.tasks[0].status).toBe("completed");
  expect(result.memory.events[0].actualSeconds).toBe(2400);
  expect(result.memory.events[0].estimatedMinutes).toBe(30);
  expect(result.routeStartAt).toBe(now.toISOString());
  expect(data.tasks[0].status).toBe("pending");
});
it("não duplica conclusão ou sessão", () => {
  const done = completeTask(active(), "1", now);
  expect(completeTask(done, "1", now)).toBe(done);
  expect(
    archiveFocus({ ...done, focus: active().focus }, "ended", now).memory
      .sessions,
  ).toHaveLength(1);
});
it("adiar guarda eventos e mantém o prazo", () => {
  const before = active();
  const result = deferTask(before, "1", now);
  expect(result.memory.events[0].kind).toBe("deferred");
  expect(result.memory.sessions[0].outcome).toBe("deferred");
  expect(result.tasks[0].dueDate).toBe(before.tasks[0].dueDate);
  expect(result.deferredIds).toEqual(["1"]);
});
it("cada adiamento conta, mas o id não se repete na ordem", () => {
  let data = createSeed();
  data = deferTask(deferTask(data, "1", now), "1", now);
  expect(data.deferredIds).toEqual(["1"]);
  expect(data.memory.events).toHaveLength(2);
});
it("registra motivo do debugger e o instante", () => {
  const event = memoryEvent(active().tasks[0], "stuck", now, "tired");
  expect(event.reason).toBe("tired");
  expect(event.occurredAt).toBe(now.toISOString());
});
it("desconta somente sessões do dia do orçamento", () => {
  const result = archiveFocus(active(), "ended", now);
  expect(usedStudyMinutes(result, now)).toBe(40);
  expect(usedStudyMinutes(result, new Date(2026, 9, 6))).toBe(0);
});
it("tempo pausado não conta como estudo", () => {
  const data = active();
  data.focus = { ...data.focus!, elapsedSeconds: 50, runningSince: null };
  expect(
    archiveFocus(data, "ended", now).memory.sessions[0].actualSeconds,
  ).toBe(50);
});
