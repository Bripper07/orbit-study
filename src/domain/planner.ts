import type { Risk, Task } from "../types";
export function dateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function daysUntil(dueDate: string, now = new Date()): number {
  const [y, m, d] = dueDate.split("-").map(Number);
  return Math.round(
    (Date.UTC(y, m - 1, d) -
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) /
      86400000,
  );
}
export function calculateTaskRisk(task: Task, now = new Date()): Risk {
  if (task.status === "completed") return "baixo";
  const days = daysUntil(task.dueDate, now);
  if (
    days < 0 ||
    days <= 1 ||
    (days <= 3 && (task.priority === "high" || task.estimatedMinutes >= 90))
  )
    return "alto";
  if (
    days <= 7 ||
    (days <= 14 && task.priority === "high" && task.estimatedMinutes >= 90)
  )
    return "médio";
  return "baixo";
}
const weights = { high: 30, medium: 15, low: 0 };
export function taskScore(task: Task, now = new Date()): number {
  const days = daysUntil(task.dueDate, now);
  return (
    (days < 0 ? 200 + Math.min(30, -days) : Math.max(0, 100 - days * 10)) +
    weights[task.priority] +
    Math.max(0, 15 - task.estimatedMinutes / 10)
  );
}
export function generateDailyPlan(
  tasks: Task[],
  availableMinutes: number,
  now = new Date(),
  deferredIds: string[] = [],
) {
  const ordered = tasks
    .filter((t) => t.status === "pending")
    .sort(
      (a, b) =>
        Number(deferredIds.includes(a.id)) -
          Number(deferredIds.includes(b.id)) ||
        taskScore(b, now) - taskScore(a, now) ||
        a.createdAt.localeCompare(b.createdAt) ||
        a.id.localeCompare(b.id),
    );
  let used = 0;
  const today: Task[] = [];
  const later: Task[] = [];
  for (const task of ordered) {
    if (used + task.estimatedMinutes <= availableMinutes) {
      today.push(task);
      used += task.estimatedMinutes;
    } else later.push(task);
  }
  const totalMinutes = ordered.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  return {
    ordered,
    today,
    later,
    plannedMinutes: used,
    totalMinutes,
    feasibility: totalMinutes
      ? Math.min(100, Math.round((availableMinutes / totalMinutes) * 100))
      : 100,
  };
}
export function getRecommendedTask(plan: ReturnType<typeof generateDailyPlan>) {
  return plan.today[0] ?? null;
}
export function replanDay(
  tasks: Task[],
  availableMinutes: number,
  now = new Date(),
  deferredIds: string[] = [],
) {
  return generateDailyPlan(tasks, availableMinutes, now, deferredIds);
}
export function deadlineLabel(task: Task, now = new Date()): string {
  const d = daysUntil(task.dueDate, now);
  return d < 0
    ? `${-d} dia${d === -1 ? "" : "s"} em atraso`
    : d === 0
      ? "Prazo hoje"
      : d === 1
        ? "Prazo amanhã"
        : `Prazo em ${d} dias`;
}
