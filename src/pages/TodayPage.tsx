import type { AppData, Task, Subject, Page } from "../types";
import type { ReactNode } from "react";
import {
  Orbit,
  ArrowUpRight,
  ArrowRight,
  RotateCw,
  Play,
  Check,
  Clock3,
  Flag,
  Sprout,
  Coffee,
} from "lucide-react";
import { generateDailyPlan, deadlineLabel } from "../domain/planner";
import { prettyMinutes } from "../lib/format";
interface Props {
  data: AppData;
  plan: ReturnType<typeof generateDailyPlan>;
  recommended: Task | null;
  risks: Task[];
  completed: number;
  greeting: string;
  subject: (id: string) => Subject | undefined;
  replan: () => void;
  setAvailable: (minutes: number) => void;
  setTimeModal: (open: boolean) => void;
  start: (task: Task) => void;
  setEditing: (task: Task | null) => void;
  setSubjectFilter: (id: string) => void;
  setPage: (page: Page) => void;
  row: (task: Task, index?: number) => ReactNode;
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
  setAvailable,
  setTimeModal,
  start,
  setEditing,
  setSubjectFilter,
  setPage,
  row,
}: Props) {
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="live-dot" /> UM NOVO PASSO, NO SEU RITMO
          </div>
          <h1>
            {greeting}, Bruno<span className="greeting-dot">.</span>
          </h1>
          <p>Vamos encontrar espaço para o que importa hoje.</p>
        </div>
        <button className="button subtle" onClick={replan}>
          <RotateCw size={16} />
          Replanejar meu dia
        </button>
      </div>
      <div className="today-grid">
        <section className="route-area">
          <div className="plan-summary">
            <div
              className="viability-ring"
              style={
                {
                  "--percentage": `${plan.feasibility}%`,
                } as React.CSSProperties
              }
            >
              <span>
                {plan.feasibility}
                <small>%</small>
              </span>
            </div>
            <div>
              <h2>Seu dia tem uma rota.</h2>
              <p>
                <strong>{plan.feasibility}% viável</strong> com o tempo que você
                reservou.
              </p>
              <span className="subtext">
                {plan.today.length} tarefas na rota ·{" "}
                {prettyMinutes(plan.plannedMinutes)} de estudo
              </span>
            </div>
            <button
              className="icon-button"
              onClick={() => {
                setAvailable(data.dailyMinutes);
                setTimeModal(true);
              }}
              aria-label="Ajustar tempo disponível"
            >
              <ArrowUpRight size={19} />
            </button>
          </div>
          <div className="section-label">
            <span>SEU PRÓXIMO PASSO</span>
            <span>Menos decisões. Mais movimento.</span>
          </div>
          {recommended ? (
            <article className="now-card">
              <div className="now-top">
                <span className="now-badge">
                  <span className="live-dot" />
                  AGORA
                </span>
                <span className="subject-label">
                  <i
                    style={{
                      background: subject(recommended.subjectId)?.color,
                    }}
                  />
                  {subject(recommended.subjectId)?.name}
                </span>
              </div>
              <h2>{recommended.title}</h2>
              <p>
                {recommended.description ||
                  "Um bloco de estudo para avançar no que importa."}
              </p>
              <div className="now-metadata">
                <span>
                  <Clock3 size={16} />
                  {recommended.estimatedMinutes} min
                </span>
                <span>
                  <Flag size={15} />
                  {deadlineLabel(recommended)}
                </span>
              </div>
              <div className="now-bottom">
                <button
                  className="button primary"
                  onClick={() => start(recommended)}
                >
                  <Play size={16} fill="currentColor" />
                  Começar a estudar
                  <ArrowRight size={17} />
                </button>
                <span>Seu foco começa aqui.</span>
              </div>
              <Orbit className="card-orbit" size={190} strokeWidth={0.55} />
            </article>
          ) : (
            <article className="now-card empty-card">
              <Sprout size={30} />
              <h2>
                {plan.ordered.length
                  ? "Abra espaço para começar."
                  : "Tudo em dia por aqui."}
              </h2>
              <p>
                {plan.ordered.length
                  ? "Nenhuma tarefa cabe no tempo disponível. Ajuste seu tempo ou divida uma tarefa em um passo menor."
                  : "Adicione um próximo passo quando estiver pronto."}
              </p>
              <button
                className="button primary"
                onClick={() =>
                  plan.ordered.length ? setTimeModal(true) : setEditing(null)
                }
              >
                {plan.ordered.length ? "Ajustar meu tempo" : "Criar tarefa"}
              </button>
            </article>
          )}
          <div className="section-title">
            <h2>
              Depois, na sua rota{" "}
              <span>{Math.max(0, plan.today.length - 1)}</span>
            </h2>
            <button
              className="text-button"
              onClick={() => {
                setSubjectFilter("all");
                setPage("To-do");
              }}
            >
              Ver todas
              <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="route-list">
            {plan.today.slice(1).map((t, i) => row(t, i + 1))}
            {plan.today.length <= 1 && (
              <div className="empty-inline">
                {plan.today.length
                  ? "Uma tarefa por vez. Sua rota continua quando você concluir."
                  : "Sua rota está livre."}
              </div>
            )}
          </div>
          {plan.later.length > 0 && (
            <div className="later-note">
              <Coffee size={16} />
              {plan.later.length} tarefa
              {plan.later.length > 1 ? "s" : ""} fora da rota de hoje. Elas
              continuam no To-do.
            </div>
          )}
        </section>
        <aside className="day-aside">
          <section className="day-card">
            <div className="section-title">
              <h2>Espaço para estudar</h2>
              <Clock3 size={17} />
            </div>
            <div className="time-total">
              {prettyMinutes(data.dailyMinutes)}
              <span>disponíveis hoje</span>
            </div>
            <div className="time-track">
              <span
                style={{
                  width: `${Math.min(100, (plan.plannedMinutes / data.dailyMinutes) * 100)}%`,
                }}
              />
            </div>
            <div className="time-legend">
              <span>{prettyMinutes(plan.plannedMinutes)} planejados</span>
              <span>
                {prettyMinutes(data.dailyMinutes - plan.plannedMinutes)} livres
              </span>
            </div>
            <button
              className="text-button"
              onClick={() => {
                setAvailable(data.dailyMinutes);
                setTimeModal(true);
              }}
            >
              Ajustar meu tempo
              <ArrowRight size={14} />
            </button>
          </section>
          <section className="risk-card">
            <div className="section-title">
              <h2>
                <span className="amber-dot" />
                No seu radar
              </h2>
              <span className="count-badge">{risks.length}</span>
            </div>
            <p>
              Um pouco de atenção agora
              <br />
              pode aliviar o depois.
            </p>
            {risks.slice(0, 3).map((t) => (
              <button
                className="radar-preview"
                key={t.id}
                onClick={() => setEditing(t)}
              >
                <span>
                  <strong>{t.title}</strong>
                  <small>{deadlineLabel(t)}</small>
                </span>
                <ArrowUpRight size={16} />
              </button>
            ))}
            {!risks.length && (
              <div className="calm-state">
                <Check size={17} />
                Nenhum prazo em alto risco.
              </div>
            )}
            <button className="text-button" onClick={() => setPage("Radar")}>
              Abrir Radar
              <ArrowRight size={14} />
            </button>
          </section>
          <div className="daily-progress">
            <span className="tiny-check">
              <Check size={14} />
            </span>
            <div>
              <strong>
                {completed} tarefa{completed !== 1 ? "s" : ""} concluída
                {completed !== 1 ? "s" : ""} hoje
              </strong>
              <p>Cada pequeno passo conta.</p>
            </div>
          </div>
        </aside>
      </div>
      <footer className="page-footer">
        <Orbit size={15} />
        <span>O plano se adapta a você. E não o contrário.</span>
        <span>FEITO PARA O SEU RITMO</span>
      </footer>
    </>
  );
}
