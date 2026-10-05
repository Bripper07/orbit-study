import type { AppData, Task, Page } from "../types";
import type { ReactNode } from "react";
import { ArrowUpRight, Check, Compass, Lightbulb } from "lucide-react";
import { daysUntil, calculateTaskRisk } from "../domain/planner";
import { getInsights } from "../domain/insights";
interface Props {
  data: AppData;
  now: Date;
  row: (task: Task) => ReactNode;
  setSubjectFilter: (id: string) => void;
  setPage: (page: Page) => void;
}
export function RadarPage({
  data,
  now,
  row,
  setSubjectFilter,
  setPage,
}: Props) {
  const pending = data.tasks.filter((t) => t.status === "pending");
  const insights = getInsights(data);
  const inactive = data.subjects.filter(
    (s) =>
      !data.memory.sessions.some(
        (f) =>
          f.subjectId === s.id &&
          f.actualSeconds >= 60 &&
          new Date(f.endedAt).getTime() >= now.getTime() - 7 * 86400000,
      ) &&
      !data.tasks.some(
        (t) =>
          t.subjectId === s.id &&
          t.completedAt &&
          new Date(t.completedAt).getTime() >= now.getTime() - 7 * 86400000,
      ),
  );
  const groups = [
    {
      title: "ATRASADO",
      tone: "overdue",
      tasks: pending.filter((t) => daysUntil(t.dueDate, now) < 0),
    },
    {
      title: "ALTO RISCO",
      tone: "high",
      tasks: pending.filter(
        (t) =>
          daysUntil(t.dueDate, now) >= 0 &&
          calculateTaskRisk(t, now) === "alto",
      ),
    },
    {
      title: "PRAZOS PRÓXIMOS",
      tone: "near",
      tasks: pending.filter(
        (t) =>
          daysUntil(t.dueDate, now) >= 0 &&
          daysUntil(t.dueDate, now) <= 7 &&
          calculateTaskRisk(t, now) !== "alto",
      ),
    },
  ];
  return (
    <div className="radar-desktop">
      <div className="page-heading">
        <div>
          <h1>Radar</h1>
          <p>O que merece sua atenção, antes do próximo passo.</p>
        </div>
        <Compass size={26} strokeWidth={1.3} className="muted" />
      </div>
      {groups
        .filter((g) => g.tasks.length)
        .map((group) => (
          <section
            className={`attention-section ${group.tone}`}
            key={group.title}
          >
            <h2>
              <span className="attention-dot" />
              {group.title}
              <span>{group.tasks.length}</span>
            </h2>
            <div className="task-list">{group.tasks.map(row)}</div>
          </section>
        ))}
      {!pending.length && (
        <div className="empty-inline">
          <Check size={17} />
          Nenhum prazo pendente. Seu radar está tranquilo.
        </div>
      )}
      {inactive.length > 0 && (
        <section className="attention-section">
          <h2>ATENÇÃO</h2>
          <div className="inactive-subjects">
            {inactive.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setSubjectFilter(s.id);
                  setPage("To-do");
                }}
              >
                <i style={{ background: s.color }} />
                <span>
                  <strong>{s.name} ficou fora das sessões recentes.</strong>
                  <small>
                    Sem estudo registrado nos últimos 7 dias. Vale reservar um
                    próximo passo?
                  </small>
                </span>
                <ArrowUpRight size={15} />
              </button>
            ))}
          </div>
        </section>
      )}
      <section className="attention-section insight-section">
        <h2>
          <Lightbulb size={15} />
          PERCEPÇÕES DO SEU RITMO
        </h2>
        {insights.length ? (
          insights.map((insight) => (
            <div className="insight" key={insight.id}>
              <p>{insight.text}</p>
              <span>{insight.evidence}</span>
            </div>
          ))
        ) : (
          <p className="quiet-empty">
            Suas sessões vão formar um histórico. As primeiras percepções
            aparecem quando houver observações suficientes.
          </p>
        )}
      </section>
      <p className="radar-footnote">
        Risco é uma indicação de atenção baseada em prazo, prioridade e duração.
        Seus dados ficam neste dispositivo.
      </p>
    </div>
  );
}
