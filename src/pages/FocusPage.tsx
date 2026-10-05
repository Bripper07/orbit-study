import type { Task, Subject, FocusSession } from "../types";
import {
  Play,
  Pause,
  Check,
  CircleHelp,
  ArrowRight,
  ScanLine,
} from "lucide-react";
interface Props {
  activeTask: Task | undefined;
  session: FocusSession | null;
  subject: (id: string) => Subject | undefined;
  actualSeconds: number;
  pause: () => void;
  resume: () => void;
  onComplete: () => void;
  onEnd: () => void;
  openDebug: () => void;
  recommended: Task | null;
  start: (task: Task) => void;
  onTasks: () => void;
  completion: string | null;
}
export function FocusPage({
  activeTask,
  session,
  subject,
  actualSeconds,
  pause,
  resume,
  onComplete,
  onEnd,
  openDebug,
  recommended,
  start,
  onTasks,
  completion,
}: Props) {
  if (completion)
    return (
      <div className="focus-completion">
        <span className="completion-check">
          <Check size={30} strokeWidth={1.3} />
        </span>
        <span className="eyebrow">UM PASSO CONCLUÍDO</span>
        <h1>{completion}</h1>
        <p>Você abriu espaço para o que vem agora.</p>
        {recommended ? (
          <>
            <span className="completion-next">PRÓXIMO NA SUA ROTA</span>
            <h2>{recommended.title}</h2>
            <span className="muted">
              {recommended.estimatedMinutes} min ·{" "}
              {subject(recommended.subjectId)?.name}
            </span>
            <button
              className="button primary"
              onClick={() => start(recommended)}
            >
              Continuar minha rota
              <ArrowRight size={16} />
            </button>
          </>
        ) : (
          <button className="button" onClick={onTasks}>
            Voltar ao To-do
          </button>
        )}
      </div>
    );
  if (!activeTask || !session)
    return (
      <div className="large-empty focus-empty">
        <ScanLine size={35} strokeWidth={1.2} />
        <h1>Uma coisa de cada vez.</h1>
        <p>
          {recommended
            ? recommended.title
            : "Escolha seu próximo passo para iniciar uma sessão."}
        </p>
        <button
          className="button primary"
          onClick={() => (recommended ? start(recommended) : onTasks())}
        >
          <Play size={15} />
          {recommended ? "Começar a focar" : "Escolher tarefa"}
        </button>
      </div>
    );
  const remaining = Math.max(0, session.durationSeconds - actualSeconds);
  const overtime = Math.max(0, actualSeconds - session.durationSeconds);
  const display = overtime || remaining;
  const progress = Math.min(
    100,
    (actualSeconds / session.durationSeconds) * 100,
  );
  return (
    <div className="focus-view desktop-focus">
      <span className="focus-subject subject-label">
        <i style={{ background: subject(activeTask.subjectId)?.color }} />
        {subject(activeTask.subjectId)?.name}
      </span>
      <h1>{activeTask.title}</h1>
      <p>{Math.round(session.durationSeconds / 60)} min nesta sessão</p>
      <div
        className={`focus-clock ${session.runningSince === null ? "paused" : ""}`}
      >
        <span className="timer">
          {overtime > 0 ? "+" : ""}
          {String(Math.floor(display / 60)).padStart(2, "0")}
          <span>:</span>
          {String(display % 60).padStart(2, "0")}
        </span>
        <div
          className="focus-track"
          role="progressbar"
          aria-label="Progresso da sessão"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
        <span className="focus-status">
          {session.runningSince === null
            ? "Pausado · retome no seu ritmo"
            : remaining === 0
              ? "Seu tempo planejado terminou. Conclua quando estiver pronto."
              : "Só este momento. Só esta tarefa."}
        </span>
      </div>
      <div className="focus-controls">
        <button
          className="button"
          onClick={session.runningSince === null ? resume : pause}
        >
          {session.runningSince === null ? (
            <Play size={16} />
          ) : (
            <Pause size={16} />
          )}{" "}
          {session.runningSince === null ? "Retomar" : "Pausar"}
        </button>
        <button className="button primary" onClick={onComplete}>
          <Check size={17} />
          Concluir
        </button>
      </div>
      <button className="stuck-inline" onClick={openDebug}>
        <CircleHelp size={16} />
        Estou travado
      </button>
      <button className="text-button end-session" onClick={onEnd}>
        Encerrar sessão
      </button>
    </div>
  );
}
