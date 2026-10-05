import type { Task } from "../types";
import { generateDailyPlan } from "./planner";
export interface TimelineItem {
  id: string;
  kind: "task" | "break" | "free";
  startAt: string;
  endAt: string;
  minutes: number;
  task?: Task;
}
export function generateStudyRoute(
  tasks: Task[],
  budget: number,
  now = new Date(),
  deferredIds: string[] = [],
  breakMinutes = 5,
) {
  const base = generateDailyPlan(tasks, Math.max(0, budget), now, deferredIds);
  const today: Task[] = [];
  const later: Task[] = [];
  let used = 0;
  for (const task of base.ordered) {
    const cost = task.estimatedMinutes + (today.length ? breakMinutes : 0);
    if (used + cost <= budget) {
      today.push(task);
      used += cost;
    } else later.push(task);
  }
  const total =
    base.totalMinutes + Math.max(0, base.ordered.length - 1) * breakMinutes;
  return {
    ...base,
    today,
    later,
    plannedMinutes: used,
    totalMinutes: total,
    feasibility: total
      ? Math.min(100, Math.round((Math.max(0, budget) / total) * 100))
      : 100,
  };
}
export function generateDailyTimeline(
  tasks: Task[],
  startAt: string,
  budget: number,
  breakMinutes = 5,
): TimelineItem[] {
  const items: TimelineItem[] = [];
  let cursor = new Date(startAt).getTime();
  let used = 0;
  if (!Number.isFinite(cursor) || budget < 0 || breakMinutes < 0)
    throw new Error("Invalid timeline inputs");
  const add = (
    id: string,
    kind: TimelineItem["kind"],
    minutes: number,
    task?: Task,
  ) => {
    const end = cursor + minutes * 60000;
    items.push({
      id,
      kind,
      startAt: new Date(cursor).toISOString(),
      endAt: new Date(end).toISOString(),
      minutes,
      task,
    });
    cursor = end;
    used += minutes;
  };
  for (const task of tasks) {
    const pause = items.length ? breakMinutes : 0;
    if (used + pause + task.estimatedMinutes > budget) break;
    if (pause) add(`break-${task.id}`, "break", pause);
    add(task.id, "task", task.estimatedMinutes, task);
  }
  if (used < budget) add("free", "free", budget - used);
  return items;
}
export function compareRoutes(before: TimelineItem[], after: TimelineItem[]) {
  const old = new Map(
    before.filter((i) => i.kind === "task").map((i) => [i.id, i]),
  );
  return after
    .filter((i) => i.kind === "task")
    .map((item, index) => ({
      item,
      previous: old.get(item.id),
      changed:
        Math.floor(
          new Date(old.get(item.id)?.startAt ?? "").getTime() / 60000,
        ) !== Math.floor(new Date(item.startAt).getTime() / 60000) ||
        before
          .filter((i) => i.kind === "task")
          .findIndex((i) => i.id === item.id) !== index,
    }));
}
export function routeStart(settingsTime: string, now = new Date()): string {
  const [h, m] = settingsTime.split(":").map(Number);
  const start = new Date(now);
  start.setHours(h, m, 0, 0);
  return start.toISOString();
}
export function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
