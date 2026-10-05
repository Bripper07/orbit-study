import type { AppData, Task, Subject } from "../types";
import {
  Play,
  Clock3,
  ArrowRight,
  RotateCw,
  CircleHelp,
  SlidersHorizontal,
  ArrowUpRight,
  Coffee,
} from "lucide-react";
import { deadlineLabel } from "../domain/planner";
import {
  generateDailyTimeline,
  timeLabel,
  type TimelineItem,
  generateStudyRoute,
} from "../domain/timeline";
import { prettyMinutes } from "../lib/format";
interface Props {
  data: AppData;
  plan: ReturnType<typeof generateStudyRoute>;
  recommended: Task | null;
  risks: Task[];
  completed: number;
  greeting: string;
  subject: (id: string) => Subject | undefined;
  replan: () => void;
  start: (task: Task) => void;
  onDefer: (task: Task) => void;
  onDebug: (task: Task) => void;
  onTime: () => void;
  onTasks: () => void;
  onRadar: () => void;
  availableMinutes: number;
}
export function DailyTimeline({
  items,
  subject,
}: {
  items: TimelineItem[];
  subject: (id: string) => Subject | undefined;
}) {
  return (
    <ol className="daily-timeline">
      {items.map((item, i) => (
        <li key={item.id} className={`timeline-${item.kind}`}>
          <time>{timeLabel(item.startAt)}</time>
          <span
            className="timeline-point"
            style={{
              background: item.task
                ? subject(item.task.subjectId)?.color
                : undefined,
            }}
          />
          <div>
            <strong>
              {item.kind === "task"
                ? item.task?.title
                : item.kind === "break"
                  ? "Pausa"
                  : "Espaço livre"}
            </strong>
            <span>
              {item.kind === "task"
                ? `${subject(item.task!.subjectId)?.name} · ${item.minutes} min`
                : item.kind === "break"
                  ? `${item.minutes} min para respirar`
                  : `${prettyMinutes(Math.round(item.minutes))} sem tarefas`}
            </span>
          </div>
          {i === 0 && item.kind === "task" && (
            <span className="timeline-now">agora</span>
          )}
        </li>
      ))}
    </ol>
  );
}
export function TodayPage({
  data,
  plan,
  recommended,
  risks,
  completed,
  greeting,
  subject,
  replan,
  start,
  onDefer,
  onDebug,
  onTime,
  onTasks,
  onRadar,
  availableMinutes,
}: Props) {
  const timeline = generateDailyTimeline(
    plan.today,
    data.routeStartAt,
    availableMinutes,
    data.settings.breakMinutes,
  );
  return (
    <div className="today-desktop">
      <div className="today-intro">
        <div>
          <h1>
            {greeting}, {data.settings.name}
            <span className="greeting-dot">.</span>
          </h1>
          <p>
            Seu dia está <strong>{plan.feasibility}% viável</strong>
            <span className="intro-separator">·</span>
            {prettyMinutes(Math.round(availableMinutes))} disponíveis
            <button
              className="inline-icon"
              aria-label="Ajustar meu tempo"
              onClick={onTime}
            >
              <SlidersHorizontal size={13} />
            </button>
          </p>
        </div>
        <button className="text-button replan-link" onClick={replan}>
          <RotateCw size={14} />
          Replanejar meu dia
        </button>
      </div>
      <div className="study-surface">
        <section className="next-step">
          <div className="section-label">
            <span className="live-dot" />
            AGORA<span className="section-note">Seu próximo passo</span>
          </div>
          {recommended ? (
            <>
              <span className="hero-subject">
                <i
                  style={{ background: subject(recommended.subjectId)?.color }}
                />
                {subject(recommended.subjectId)?.name}
              </span>
              <h2>{recommended.title}</h2>
              <div className="hero-meta">
                <span>
                  <Clock3 size={15} />
                  {recommended.estimatedMinutes} min
                </span>
                <span>{deadlineLabel(recommended)}</span>
              </div>
              {recommended.description && (
                <p className="hero-description">{recommended.description}</p>
              )}
              <div className="hero-actions">
                <button
                  className="button primary"
                  onClick={() => start(recommended)}
                >
                  <Play size={15} fill="currentColor" />
                  Começar
                  <ArrowRight size={16} />
                </button>
                <button
                  className="button ghost"
                  onClick={() => onDefer(recommended)}
                >
                  Adiar
                </button>
              </div>
              <button
                className="stuck-inline"
                onClick={() => onDebug(recommended)}
              >
                <CircleHelp size={15} />
                Estou travado
                <ArrowUpRight size={13} />
              </button>
            </>
          ) : (
            <div className="empty-next">
              <Coffee size={27} strokeWidth={1.3} />
              <h2>
                {plan.ordered.length
                  ? "Um passo menor pode caber."
                  : "Sua rota está livre."}
              </h2>
              <p>
                {plan.ordered.length
                  ? "Ajuste seu tempo ou divida uma tarefa no To-do."
                  : "Você pode descansar ou escolher um novo próximo passo."}
              </p>
              <button
                className="button"
                onClick={plan.ordered.length ? onTime : onTasks}
              >
                {plan.ordered.length ? "Ajustar tempo" : "Abrir To-do"}
              </button>
            </div>
          )}
          <div className="next-tasks">
            <div className="section-title">
              <h3>PRÓXIMOS</h3>
              <button className="text-button" onClick={onTasks}>
                Ver To-do
                <ArrowUpRight size={12} />
              </button>
            </div>
            {plan.today.slice(1, 4).map((task, i) => (
              <button
                className="next-task"
                key={task.id}
                onClick={() => start(task)}
              >
                <span className="route-number">
                  {String(i + 2).padStart(2, "0")}
                </span>
                <i style={{ background: subject(task.subjectId)?.color }} />
                <span className="next-task-title">{task.title}</span>
                <span className="next-task-duration">
                  {task.estimatedMinutes} min
                </span>
                <Play size={13} />
              </button>
            ))}
            {plan.today.length <= 1 && (
              <p className="quiet-empty">Só este passo por enquanto.</p>
            )}
            {plan.later.length > 0 && (
              <p className="backlog-note">
                {plan.later.length}{" "}
                {plan.later.length === 1 ? "tarefa fica" : "tarefas ficam"} no
                To-do para outro momento.
              </p>
            )}
          </div>
        </section>
        <aside className="day-timeline">
          <div className="section-title">
            <h3>SEU DIA</h3>
            <button
              aria-label="Ajustar plano diário"
              className="inline-icon"
              onClick={onTime}
            >
              <SlidersHorizontal size={14} />
            </button>
          </div>
          <p className="timeline-summary">
            {plan.today.length} passos ·{" "}
            {data.settings.breakMinutes
              ? `pausas de ${data.settings.breakMinutes} min`
              : "sem pausas programadas"}
          </p>
          <DailyTimeline items={timeline} subject={subject} />
          <div className="route-footer">
            <span className="tiny-check">✓</span>
            <span>
              {completed}{" "}
              {completed === 1 ? "tarefa concluída" : "tarefas concluídas"} hoje
            </span>
          </div>
          {risks.length > 0 && (
            <button className="attention-link" onClick={onRadar}>
              <span className="amber-dot" />
              {risks.length}{" "}
              {risks.length === 1 ? "prazo precisa" : "prazos precisam"} de
              atenção
              <ArrowRight size={13} />
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}
