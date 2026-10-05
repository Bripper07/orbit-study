import type { AppData } from "../types";
export interface Insight {
  id: string;
  text: string;
  evidence: string;
}
export function getInsights(data: AppData): Insight[] {
  const insights: Insight[] = [];
  const { events, sessions } = data.memory;
  for (const subject of data.subjects) {
    const completed = events.filter(
      (e) =>
        e.kind === "completed" &&
        e.subjectId === subject.id &&
        e.actualSeconds !== undefined &&
        (e.estimatedMinutes ?? 0) > 0,
    );
    const unique = Array.from(
      new Map(completed.map((e) => [e.taskId, e])).values(),
    );
    const overruns = unique.filter(
      (e) => e.actualSeconds! > e.estimatedMinutes! * 60 * 1.2,
    );
    if (unique.length >= 5 && overruns.length / unique.length >= 0.6)
      insights.push({
        id: `estimate-${subject.id}`,
        text: `Você costuma precisar de mais tempo em ${subject.name} do que estima.`,
        evidence: `${overruns.length} de ${unique.length} tarefas observadas ultrapassaram a estimativa em mais de 20%.`,
      });
    const stuck = events.filter(
      (e) => e.kind === "stuck" && e.subjectId === subject.id,
    );
    if (stuck.length >= 4)
      insights.push({
        id: `stuck-${subject.id}`,
        text: `Você usou “Estou travado” ${stuck.length} vezes em ${subject.name}.`,
        evidence:
          "Registro de uso do debugger. Isso não indica falta de capacidade.",
      });
  }
  for (const task of data.tasks.filter((t) => t.status === "pending")) {
    const count = events.filter(
      (e) => e.kind === "deferred" && e.taskId === task.id,
    ).length;
    if (count >= 3)
      insights.push({
        id: `defer-${task.id}`,
        text: `Você adiou “${task.title}” ${count} vezes.`,
        evidence: "Pode ser um bom momento para diminuir o primeiro passo.",
      });
  }
  const finished = sessions.filter(
    (s) => s.outcome === "completed" && s.actualSeconds >= 60,
  );
  if (finished.length >= 8) {
    const slots = [
      { name: "pela manhã", test: (h: number) => h >= 5 && h < 12 },
      { name: "à tarde", test: (h: number) => h >= 12 && h < 18 },
      { name: "à noite", test: (h: number) => h >= 18 || h < 5 },
    ];
    const counts = slots
      .map((s) => ({
        ...s,
        count: finished.filter((f) => s.test(new Date(f.startedAt).getHours()))
          .length,
      }))
      .sort((a, b) => b.count - a.count);
    if (counts[0].count / finished.length >= 0.6)
      insights.push({
        id: "time-of-day",
        text: `Você concluiu mais sessões ${counts[0].name}.`,
        evidence: `${counts[0].count} de ${finished.length} sessões concluídas. O horário disponível também influencia esse padrão.`,
      });
  }
  return insights;
}
