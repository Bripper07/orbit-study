import type { AppData, Task, Subject, FocusSession, Page } from "../types";
import {
  ScanLine,
  ArrowUpRight,
  Play,
  Pause,
  Check,
  CircleHelp,
} from "lucide-react";
interface Props {
  activeTask: Task | undefined;
  session: FocusSession | null;
  subject: (id: string) => Subject | undefined;
  remaining: number;
  progress: number;
  pause: () => void;
  update: (fn: (data: AppData) => AppData) => void;
  toggleTask: (id: string) => void;
  setNotice: (message: string) => void;
  setPage: (page: Page) => void;
  openDebug: () => void;
  recommended: Task | null;
  start: (task: Task) => void;
}
export function FocusPage({
  activeTask,
  session,
  subject,
  remaining,
  progress,
  pause,
  update,
  toggleTask,
  setNotice,
  setPage,
  openDebug,
  recommended,
  start,
}: Props) {
  return (
    <>
      {activeTask && session ? (
        <div className="focus-view">
          <div className="eyebrow">
            <span className="live-dot" /> UM PASSO É O SUFICIENTE
          </div>
          <span className="focus-subject subject-label">
            <i
              style={{
                background: subject(activeTask.subjectId)?.color,
              }}
            />
            {subject(activeTask.subjectId)?.name}
          </span>
          <h1>{activeTask.title}</h1>
          <p>
            {Math.round(session.durationSeconds / 60)} minutos reservados para
            este momento.
          </p>
          <div
            className="timer-ring"
            style={{ "--progress": `${progress}%` } as React.CSSProperties}
          >
            <div>
              <span className="timer">
                {String(Math.floor(remaining / 60)).padStart(2, "0")}
                <span>:</span>
                {String(remaining % 60).padStart(2, "0")}
              </span>
              <small>
                {remaining === 0
                  ? "Sessão finalizada"
                  : session.runningSince === null
                    ? "No seu tempo · pausado"
                    : "Respire. Só esta tarefa agora."}
              </small>
            </div>
          </div>
          <div className="focus-controls">
            <button
              className="button"
              disabled={remaining === 0}
              onClick={() =>
                session.runningSince === null
                  ? update((d) => ({
                      ...d,
                      focus: d.focus
                        ? { ...d.focus, runningSince: Date.now() }
                        : null,
                    }))
                  : pause()
              }
            >
              {session.runningSince === null ? (
                <Play size={17} />
              ) : (
                <Pause size={17} />
              )}{" "}
              {session.runningSince === null ? "Retomar" : "Pausar"}
            </button>
            <button
              className="button primary"
              onClick={() => {
                toggleTask(activeTask.id);
                setNotice("Mais um passo concluído. Boa!");
                setPage("Hoje");
              }}
            >
              <Check size={18} />
              Concluir tarefa
            </button>
          </div>
          <button className="stuck-button" onClick={openDebug}>
            <CircleHelp size={18} />
            Estou travado
            <ArrowUpRight size={16} />
          </button>
          <button
            className="text-button end-session"
            onClick={() => {
              update((d) => ({ ...d, focus: null }));
              setPage("Hoje");
              setNotice("Sessão encerrada. A tarefa continua pendente.");
            }}
          >
            Encerrar sessão e voltar à rota
          </button>
          {activeTask.description && (
            <div className="focus-note">
              <span>UMA LEMBRANÇA PARA COMEÇAR</span>
              <p>{activeTask.description}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="large-empty focus-empty">
          <ScanLine size={42} strokeWidth={1} />
          <div className="eyebrow">ENCONTRE SEU RITMO</div>
          <h1>Espaço para uma coisa só.</h1>
          <p>
            {recommended
              ? `Seu próximo passo: ${recommended.title}`
              : "Escolha uma tarefa no To-do para começar uma sessão."}
          </p>
          <button
            className="button primary"
            onClick={() =>
              recommended ? start(recommended) : setPage("To-do")
            }
          >
            <Play size={16} />
            {recommended ? "Iniciar meu próximo passo" : "Escolher tarefa"}
          </button>
        </div>
      )}
    </>
  );
}
