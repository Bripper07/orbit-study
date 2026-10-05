import type { AppData, Task } from "../types";
import { createSeed } from "../domain/seed";
import { dateKey } from "../domain/planner";
import { routeStart } from "../domain/timeline";
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
export function migrateData(value: unknown): AppData {
  if (!isObject(value) || (value.version !== 1 && value.version !== 2))
    throw new Error("Versão de dados inválida");
  // Reuse the existing validator through an isolated value, without touching browser storage.
  validateCore(value);
  const defaults = createSeed();
  if (value.version === 2) {
    const memory = value.memory,
      settings = value.settings;
    if (
      !isObject(memory) ||
      !Array.isArray(memory.sessions) ||
      !memory.sessions.every(
        (s) =>
          isObject(s) &&
          typeof s.id === "string" &&
          typeof s.taskId === "string" &&
          typeof s.taskTitle === "string" &&
          typeof s.subjectId === "string" &&
          typeof s.startedAt === "string" &&
          Number.isFinite(Date.parse(s.startedAt)) &&
          typeof s.endedAt === "string" &&
          Number.isFinite(Date.parse(s.endedAt)) &&
          typeof s.actualSeconds === "number" &&
          Number.isFinite(s.actualSeconds) &&
          s.actualSeconds >= 0 &&
          typeof s.plannedSeconds === "number" &&
          s.plannedSeconds > 0 &&
          ["completed", "ended", "deferred"].includes(String(s.outcome)),
      ) ||
      !Array.isArray(memory.events) ||
      !memory.events.every(
        (e) =>
          isObject(e) &&
          typeof e.id === "string" &&
          typeof e.taskId === "string" &&
          typeof e.subjectId === "string" &&
          typeof e.occurredAt === "string" &&
          Number.isFinite(Date.parse(e.occurredAt)) &&
          ["completed", "deferred", "stuck"].includes(String(e.kind)) &&
          (e.reason === undefined ||
            ["start", "large", "tired", "information", "avoid"].includes(
              String(e.reason),
            )) &&
          (e.actualSeconds === undefined ||
            (typeof e.actualSeconds === "number" &&
              Number.isFinite(e.actualSeconds) &&
              e.actualSeconds >= 0)) &&
          (e.estimatedMinutes === undefined ||
            (typeof e.estimatedMinutes === "number" && e.estimatedMinutes > 0)),
      ) ||
      !isObject(settings) ||
      typeof settings.name !== "string" ||
      !settings.name.trim() ||
      typeof settings.startTime !== "string" ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(settings.startTime) ||
      typeof settings.breakMinutes !== "number" ||
      settings.breakMinutes < 0 ||
      settings.breakMinutes > 30 ||
      typeof value.routeStartAt !== "string" ||
      !Number.isFinite(Date.parse(value.routeStartAt))
    )
      throw new Error("Memória ou configurações inválidas");
  }
  const data = {
    ...value,
    version: 2,
    memory: value.version === 2 ? value.memory : defaults.memory,
    settings: value.version === 2 ? value.settings : defaults.settings,
    routeStartAt:
      value.version === 2 ? value.routeStartAt : defaults.routeStartAt,
  } as unknown as AppData;
  return data.planDate === dateKey()
    ? data
    : {
        ...data,
        deferredIds: [],
        planDate: dateKey(),
        routeStartAt: routeStart(data.settings.startTime),
      };
}
function validateCore(value: Record<string, unknown>) {
  if (
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
  const focus = value.focus;
  if (
    focus !== null &&
    (!isObject(focus) ||
      typeof focus.taskId !== "string" ||
      typeof focus.durationSeconds !== "number" ||
      !Number.isFinite(focus.durationSeconds) ||
      focus.durationSeconds <= 0 ||
      typeof focus.elapsedSeconds !== "number" ||
      !Number.isFinite(focus.elapsedSeconds) ||
      focus.elapsedSeconds < 0 ||
      !(
        focus.runningSince === null ||
        (typeof focus.runningSince === "number" &&
          Number.isFinite(focus.runningSince))
      ) ||
      (focus.id !== undefined && typeof focus.id !== "string") ||
      (focus.startedAt !== undefined &&
        (typeof focus.startedAt !== "string" ||
          !Number.isFinite(Date.parse(focus.startedAt)))))
  )
    throw new Error("Sessão inválida");
}
export const localRepository: DataRepository = {
  load() {
    const raw = localStorage.getItem(KEY);
    if (!raw) return createSeed();
    return migrateData(JSON.parse(raw));
  },
  save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  },
};
