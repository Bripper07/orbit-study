import type {
  AppData,
  BlockerReason,
  FocusRecord,
  MemoryEvent,
  Task,
} from "../types";
import { actualFocusSeconds } from "./focus";
import { dateKey } from "./planner";
export function memoryEvent(
  task: Task,
  kind: MemoryEvent["kind"],
  now = new Date(),
  reason?: BlockerReason,
): MemoryEvent {
  return {
    id: crypto.randomUUID(),
    kind,
    taskId: task.id,
    subjectId: task.subjectId,
    occurredAt: now.toISOString(),
    ...(reason ? { reason } : {}),
  };
}
export function archiveFocus(
  data: AppData,
  outcome: FocusRecord["outcome"],
  now = new Date(),
): AppData {
  const focus = data.focus;
  const task = data.tasks.find((t) => t.id === focus?.taskId);
  if (!focus || !task) return { ...data, focus: null };
  const id = focus.id ?? crypto.randomUUID();
  if (data.memory.sessions.some((s) => s.id === id))
    return { ...data, focus: null };
  const record: FocusRecord = {
    id,
    taskId: task.id,
    taskTitle: task.title,
    subjectId: task.subjectId,
    startedAt:
      focus.startedAt ??
      new Date(
        now.getTime() - actualFocusSeconds(focus, now.getTime()) * 1000,
      ).toISOString(),
    endedAt: now.toISOString(),
    plannedSeconds: focus.durationSeconds,
    actualSeconds: actualFocusSeconds(focus, now.getTime()),
    outcome,
  };
  return {
    ...data,
    focus: null,
    memory: { ...data.memory, sessions: [...data.memory.sessions, record] },
  };
}
export function completeTask(
  data: AppData,
  id: string,
  now = new Date(),
): AppData {
  const task = data.tasks.find((t) => t.id === id);
  if (!task || task.status === "completed") return data;
  const archived =
    data.focus?.taskId === id ? archiveFocus(data, "completed", now) : data;
  const lastCompletion = data.memory.events
    .filter((e) => e.taskId === id && e.kind === "completed")
    .reduce(
      (latest, e) => Math.max(latest, new Date(e.occurredAt).getTime()),
      0,
    );
  const observed = archived.memory.sessions.filter(
    (s) => s.taskId === id && new Date(s.startedAt).getTime() > lastCompletion,
  );
  const event = {
    ...memoryEvent(task, "completed", now),
    estimatedMinutes: task.estimatedMinutes,
    ...(observed.length
      ? { actualSeconds: observed.reduce((n, s) => n + s.actualSeconds, 0) }
      : {}),
  };
  return {
    ...archived,
    routeStartAt: new Date(
      Math.max(new Date(data.routeStartAt).getTime(), now.getTime()),
    ).toISOString(),
    tasks: archived.tasks.map((t) =>
      t.id === id
        ? { ...t, status: "completed", completedAt: now.toISOString() }
        : t,
    ),
    memory: { ...archived.memory, events: [...archived.memory.events, event] },
  };
}
export function deferTask(
  data: AppData,
  id: string,
  now = new Date(),
): AppData {
  const task = data.tasks.find((t) => t.id === id);
  if (!task || task.status === "completed") return data;
  const archived =
    data.focus?.taskId === id ? archiveFocus(data, "deferred", now) : data;
  return {
    ...archived,
    deferredIds: [...data.deferredIds.filter((i) => i !== id), id],
    memory: {
      ...archived.memory,
      events: [...archived.memory.events, memoryEvent(task, "deferred", now)],
    },
  };
}
export function usedStudyMinutes(data: AppData, now = new Date()): number {
  return data.memory.sessions
    .filter((s) => dateKey(new Date(s.endedAt)) === dateKey(now))
    .reduce((sum, s) => sum + s.actualSeconds / 60, 0);
}
