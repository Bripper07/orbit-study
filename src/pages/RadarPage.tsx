import type { AppData, Task, Page } from "../types";
import type { ReactNode } from "react";
import { Radar, ArrowUpRight, Check, CircleHelp, BookOpen } from "lucide-react";
import {
  generateDailyPlan,
  daysUntil,
  calculateTaskRisk,
} from "../domain/planner";
interface Props {
  data: AppData;
  plan: ReturnType<typeof generateDailyPlan>;
  now: Date;
  risks: Task[];
  row: (task: Task, index?: number) => ReactNode;
  setSubjectFilter: (value: string) => void;
  setPage: (page: Page) => void;
}
export function RadarPage({
  data,
  plan,
  now,
  risks,
  row,
  setSubjectFilter,
  setPage,
}: Props) {
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">UM OLHAR UM POUCO MAIS À FRENTE</div>
          <h1>
            Seu radar<span className="greeting-dot">.</span>
          </h1>
          <p>Perceba o que precisa de atenção antes de virar urgência.</p>
        </div>
        <Radar className="page-symbol" size={52} strokeWidth={1} />
      </div>
      <div className="radar-stats">
        <div>
          <span>Em atraso</span>
          <strong>
            {plan.ordered.filter((t) => daysUntil(t.dueDate, now) < 0).length}
          </strong>
        </div>
        <div>
          <span>Próximos 7 dias</span>
          <strong>
            {
              plan.ordered.filter(
                (t) =>
                  daysUntil(t.dueDate, now) >= 0 &&
                  daysUntil(t.dueDate, now) <= 7,
              ).length
            }
          </strong>
        </div>
        <div>
          <span>Risco alto</span>
          <strong>{risks.length}</strong>
        </div>
      </div>
      {[
        { title: "Precisam de atenção", tasks: risks },
        {
          title: "Prazos próximos",
          tasks: plan.ordered.filter(
            (t) =>
              daysUntil(t.dueDate, now) >= 0 &&
              daysUntil(t.dueDate, now) <= 7 &&
              calculateTaskRisk(t, now) !== "alto",
          ),
        },
      ].map((group) => (
        <section className="radar-section" key={group.title}>
          <h2>{group.title}</h2>
          <div className="task-list">
            {group.tasks.length ? (
              group.tasks.map((t) => row(t))
            ) : (
              <div className="empty-inline">
                <Check size={17} />
                Tudo tranquilo nesta área.
              </div>
            )}
          </div>
        </section>
      ))}
      <section className="radar-section">
        <h2>Matérias sem atividade recente</h2>
        <p className="muted">Sem tarefas concluídas nos últimos 7 dias.</p>
        <div className="subject-cards">
          {data.subjects
            .filter(
              (s) =>
                !data.tasks.some(
                  (t) =>
                    t.subjectId === s.id &&
                    t.status === "completed" &&
                    t.completedAt &&
                    new Date(t.completedAt).getTime() >=
                      now.getTime() - 7 * 86400000,
                ),
            )
            .map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setSubjectFilter(s.id);
                  setPage("To-do");
                }}
              >
                <BookOpen style={{ color: s.color }} size={21} />
                <span>{s.name}</span>
                <ArrowUpRight size={16} />
              </button>
            ))}
        </div>
      </section>
      <div className="radar-explanation">
        <CircleHelp size={17} />
        <p>
          O risco considera prazo, prioridade e duração. A viabilidade compara o
          tempo disponível com todas as tarefas pendentes; não é uma previsão de
          desempenho.
        </p>
      </div>
    </>
  );
}
