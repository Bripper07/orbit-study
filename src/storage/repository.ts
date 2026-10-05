import type { AppData, Task } from "../types";
import { createSeed } from "../domain/seed";
import { dateKey } from "../domain/planner";
const KEY = "orbit.data.v1";
const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;
const validDate = (v: unknown) =>
  typeof v === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  !Number.isNaN(new Date(`${v}T12:00:00`).getTime()) &&
  dateKey(new Date(`${v}T12:00:00`)) === v;
function isTask(v: unknown): v is Task {
  return (
    isObject(v) &&
    typeof v.id === "string" &&
    typeof v.title === "string" &&
    (v.description === undefined || typeof v.description === "string") &&
    (v.completedAt === undefined ||
      (typeof v.completedAt === "string" &&
        !Number.isNaN(Date.parse(v.completedAt)))) &&
    typeof v.subjectId === "string" &&
    validDate(v.dueDate) &&
    ["low", "medium", "high"].includes(String(v.priority)) &&
    typeof v.estimatedMinutes === "number" &&
    Number.isFinite(v.estimatedMinutes) &&
    v.estimatedMinutes > 0 &&
    ["pending", "completed"].includes(String(v.status)) &&
    typeof v.createdAt === "string"
  );
}
export interface DataRepository {
  load(): AppData;
  save(data: AppData): void;
}
export const localRepository: DataRepository = {
  load() {
    const raw = localStorage.getItem(KEY);
    if (!raw) return createSeed();
    const value: unknown = JSON.parse(raw);
    if (
      !isObject(value) ||
      value.version !== 1 ||
      !Array.isArray(value.tasks) ||
      !value.tasks.every(isTask) ||
      !Array.isArray(value.subjects) ||
      !value.subjects.every(
        (s) =>
          isObject(s) &&
          typeof s.id === "string" &&
          typeof s.name === "string" &&
          typeof s.color === "string",
      ) ||
      typeof value.dailyMinutes !== "number" ||
      !Number.isFinite(value.dailyMinutes) ||
      value.dailyMinutes < 10 ||
      value.dailyMinutes > 1440 ||
      !["dark", "light"].includes(String(value.theme)) ||
      !Array.isArray(value.deferredIds) ||
      !value.deferredIds.every((id) => typeof id === "string") ||
      typeof value.planDate !== "string"
    )
      throw new Error("Dados locais inválidos");
    if (
      value.focus !== null &&
      (!isObject(value.focus) ||
        typeof value.focus.taskId !== "string" ||
        typeof value.focus.durationSeconds !== "number" ||
        !Number.isFinite(value.focus.durationSeconds) ||
        value.focus.durationSeconds <= 0 ||
        typeof value.focus.elapsedSeconds !== "number" ||
        !Number.isFinite(value.focus.elapsedSeconds) ||
        value.focus.elapsedSeconds < 0 ||
        value.focus.elapsedSeconds > value.focus.durationSeconds ||
        !(
          value.focus.runningSince === null ||
          typeof value.focus.runningSince === "number"
        ))
    )
      throw new Error("Sessão inválida");
    const data = value as unknown as AppData;
    return data.planDate === dateKey()
      ? data
      : { ...data, deferredIds: [], planDate: dateKey() };
  },
  save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  },
};
