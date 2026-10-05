import { expect, it } from "vitest";
import { elapsedFocusSeconds } from "./focus";
const session = {
  taskId: "1",
  durationSeconds: 600,
  elapsedSeconds: 30,
  runningSince: 1000,
};
it("conta tempo real mesmo após suspender a aba", () =>
  expect(elapsedFocusSeconds(session, 61000)).toBe(90));
it("pausa conserva o tempo acumulado", () =>
  expect(elapsedFocusSeconds({ ...session, runningSince: null }, 999999)).toBe(
    30,
  ));
it("limita no término e protege mudanças para trás no relógio", () => {
  expect(elapsedFocusSeconds(session, 999999)).toBe(600);
  expect(elapsedFocusSeconds(session, 0)).toBe(30);
  expect(elapsedFocusSeconds(null)).toBe(0);
});
