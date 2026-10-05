import { useEffect, useState } from "react";
import { isTauri, invoke } from "@tauri-apps/api/core";
import {
  Orbit,
  House,
  ListTodo,
  Radar,
  ScanLine,
  Plus,
  Sun,
  Moon,
  Search,
  Settings2,
  Check,
  X,
} from "lucide-react";
import type { Task, Subject, Page, BlockerReason, AppData } from "./types";
import { useOrbit } from "./hooks/useOrbit";
import { actualFocusSeconds } from "./domain/focus";
import { calculateTaskRisk, dateKey } from "./domain/planner";
import {
  generateStudyRoute,
  generateDailyTimeline,
  type TimelineItem,
} from "./domain/timeline";
import { usedStudyMinutes, archiveFocus, deferTask } from "./domain/memory";
import { TodayPage } from "./pages/TodayPage";
import { TodoPage } from "./pages/TodoPage";
import { RadarPage } from "./pages/RadarPage";
import { FocusPage } from "./pages/FocusPage";
import { TaskRow } from "./components/TaskRow";
import { TaskForm } from "./components/TaskForm";
import { Modal } from "./components/Modal";
import { CommandPalette, type Command } from "./components/CommandPalette";
import { DebuggerPanel } from "./components/DebuggerPanel";
import { RouteComparison } from "./components/RouteComparison";
import { SettingsPanel } from "./components/SettingsPanel";
const pages = [
  { name: "Hoje" as const, icon: House },
  { name: "To-do" as const, icon: ListTodo },
  { name: "Radar" as const, icon: Radar },
  { name: "Foco" as const, icon: ScanLine },
];
export default function App() {
  const {
    data,
    update,
    saveTask,
    toggleTask,
    deleteTask,
    startFocus,
    endFocus,
    defer,
    logStuck,
    selectReason,
    error,
    canSave,
    enableSaving,
    loading,
    flush,
  } = useOrbit();
  const [page, setPage] = useState<Page>("Hoje");
  const [editing, setEditing] = useState<Task | null | undefined>();
  const [subjectModal, setSubjectModal] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [subjectColor, setSubjectColor] = useState("#b8b4e9");
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("pending");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [clock, setClock] = useState(Date.now());
  const [timeModal, setTimeModal] = useState(false);
  const [available, setAvailable] = useState(data.dailyMinutes);
  const [palette, setPalette] = useState(false);
  const [settings, setSettings] = useState(false);
  const [debugTask, setDebugTask] = useState<Task | null>(null);
  const [blocker, setBlocker] = useState<BlockerReason | null>(null);
  const [stuckEventId, setStuckEventId] = useState("");
  const [comparison, setComparison] = useState<{
    before: TimelineItem[];
    after: TimelineItem[];
  } | null>(null);
  const [completion, setCompletion] = useState<string | null>(null);
  const now = new Date(clock);
  const availableMinutes = Math.max(
    0,
    data.dailyMinutes - usedStudyMinutes(data, now),
  );
  const plan = generateStudyRoute(
    data.tasks,
    availableMinutes,
    now,
    data.deferredIds,
    data.settings.breakMinutes,
  );
  const activeTask = data.tasks.find(
    (t) => t.id === data.focus?.taskId && t.status === "pending",
  );
  const session = activeTask ? data.focus : null;
  const recommended = activeTask ?? plan.today[0] ?? null;
  const elapsed = actualFocusSeconds(session, clock);
  const risks = data.tasks.filter(
    (t) => t.status === "pending" && calculateTaskRisk(t, now) === "alto",
  );
  const completed = data.tasks.filter(
    (t) =>
      t.status === "completed" &&
      t.completedAt &&
      dateKey(new Date(t.completedAt)) === dateKey(now),
  ).length;
  const subject = (id: string) => data.subjects.find((s) => s.id === id);
  const toggleTheme = () =>
    update((d) => ({ ...d, theme: d.theme === "dark" ? "light" : "dark" }));
  useEffect(() => {
    if (loading || !canSave || !isTauri()) return;
    let active = true;
    invoke<boolean>("is_smoke_mode")
      .then(async (smoke) => {
        if (!smoke || !active) return;
        await flush();
        if (active)
          await invoke("smoke_report", {
            result: {
              title: document.title,
              interfaceLoaded: !!document.querySelector(".native-app"),
              taskCount: data.tasks.length,
              memoryReady: !!data.memory,
              theme: data.theme,
            },
          });
      })
      .catch(() =>
        setNotice("Não foi possível concluir a verificação nativa."),
      );
    return () => {
      active = false;
    };
  }, [loading, canSave, flush, data.tasks.length, data.memory, data.theme]);
  useEffect(() => {
    document.documentElement.dataset.theme = data.theme;
    if (isTauri())
      import("@tauri-apps/api/window")
        .then(({ getCurrentWindow }) => getCurrentWindow().setTheme(data.theme))
        .catch(() => {});
  }, [data.theme]);
  useEffect(() => {
    const id = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(id);
  }, [notice]);
  useEffect(() => {
    if (!isTauri() || loading || !canSave) return;
    let disposed = false;
    let unlisten: (() => void) | undefined;
    import("@tauri-apps/api/window").then(async ({ getCurrentWindow }) => {
      const win = getCurrentWindow();
      const listener = await win.onCloseRequested(async (event) => {
        event.preventDefault();
        try {
          await flush();
          await win.destroy();
        } catch {
          setNotice(
            "Seus dados ainda não foram salvos. Exporte uma cópia antes de fechar.",
          );
        }
      });
      if (disposed) listener();
      else unlisten = listener;
    });
    return () => {
      disposed = true;
      unlisten?.();
    };
  }, [loading, canSave, flush]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      if (document.querySelector("dialog[open]") && !palette) return;
      if (event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPalette((p) => !p);
      }
      if (event.key.toLowerCase() === "n" && !palette) {
        event.preventDefault();
        setEditing(null);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [palette]);
  function start(task: Task) {
    if (session && session.taskId !== task.id) {
      setNotice("Encerre a sessão atual antes de começar outro passo.");
      setPage("Foco");
      return;
    }
    startFocus(task);
    setClock(Date.now());
    setCompletion(null);
    setPage("Foco");
  }
  function pause() {
    update((d) => ({
      ...d,
      focus: d.focus
        ? {
            ...d.focus,
            elapsedSeconds: actualFocusSeconds(d.focus),
            runningSince: null,
          }
        : null,
    }));
  }
  function resume() {
    update((d) => ({
      ...d,
      focus: d.focus ? { ...d.focus, runningSince: Date.now() } : null,
    }));
    setClock(Date.now());
  }
  function timelineFor(value: AppData) {
    const budget = Math.max(0, value.dailyMinutes - usedStudyMinutes(value));
    const route = generateStudyRoute(
      value.tasks,
      budget,
      new Date(),
      value.deferredIds,
      value.settings.breakMinutes,
    );
    return generateDailyTimeline(
      route.today,
      value.routeStartAt,
      budget,
      value.settings.breakMinutes,
    );
  }
  function replan() {
    const next = {
      ...data,
      deferredIds: [],
      routeStartAt: new Date(
        Math.max(Date.now(), new Date(data.routeStartAt).getTime()),
      ).toISOString(),
    };
    setComparison({ before: timelineFor(data), after: timelineFor(next) });
    update(() => next);
  }
  function postpone(task: Task) {
    const next = deferTask(data, task.id);
    setComparison({ before: timelineFor(data), after: timelineFor(next) });
    defer(task.id);
    setPage("Hoje");
  }
  function openDebug(task: Task) {
    if (session && session.taskId !== task.id) {
      setNotice("Sua sessão atual está em Foco. Vamos cuidar dela primeiro.");
      setPage("Foco");
      return;
    }
    if (session) pause();
    setDebugTask(task);
    setBlocker(null);
    setStuckEventId(logStuck(task));
  }
  function shortSession() {
    if (!debugTask) return;
    const task = debugTask;
    update((d) => {
      const next = d.focus ? archiveFocus(d, "ended") : d;
      return {
        ...next,
        focus: {
          id: crypto.randomUUID(),
          taskId: task.id,
          startedAt: new Date().toISOString(),
          durationSeconds: 600,
          elapsedSeconds: 0,
          runningSince: Date.now(),
        },
      };
    });
    setDebugTask(null);
    setCompletion(null);
    setClock(Date.now());
    setPage("Foco");
  }
  function divide() {
    if (!debugTask) return;
    const information = blocker === "information";
    setEditing({
      ...debugTask,
      id: crypto.randomUUID(),
      title: information
        ? `Descobrir o que falta: ${debugTask.title}`
        : `Primeiro passo: ${debugTask.title}`,
      description: information
        ? `Confirmar informações necessárias para: ${debugTask.title}`
        : `Parte de: ${debugTask.title}. Defina uma ação pequena que caiba em 10 minutos.`,
      estimatedMinutes: 10,
      status: "pending",
      createdAt: new Date().toISOString(),
      completedAt: undefined,
    });
    setDebugTask(null);
  }
  function row(task: Task, index?: number) {
    return (
      <TaskRow
        key={task.id}
        task={task}
        subject={subject(task.subjectId)}
        index={index}
        onToggle={() => toggleTask(task.id)}
        onStart={() => start(task)}
        onEdit={() => setEditing(task)}
        onDelete={() => setDeleting(task)}
      />
    );
  }
  const commands: Command[] = [
    {
      id: "new",
      label: "Nova tarefa",
      hint: "Ctrl / ⌘ N",
      run: () => setEditing(null),
    },
    { id: "today", label: "Ir para Hoje", run: () => setPage("Hoje") },
    {
      id: "todo",
      label: "Ir para To-do",
      run: () => {
        setSubjectFilter("all");
        setPage("To-do");
      },
    },
    { id: "radar", label: "Ir para Radar", run: () => setPage("Radar") },
    {
      id: "focus",
      label: "Iniciar foco",
      run: () => (recommended ? start(recommended) : setPage("Foco")),
    },
    { id: "theme", label: "Trocar tema", run: toggleTheme },
    { id: "settings", label: "Configurações", run: () => setSettings(true) },
  ];
  const greeting =
    now.getHours() < 12
      ? "Bom dia"
      : now.getHours() < 18
        ? "Boa tarde"
        : "Boa noite";
  if (loading)
    return (
      <div className="app-loading" role="status">
        <Orbit size={30} strokeWidth={1.3} />
        <span>Abrindo seu espaço…</span>
      </div>
    );
  return (
    <div
      className={`app-shell desktop-shell ${isTauri() ? "native-app" : ""} ${isTauri() && /Mac/.test(navigator.platform) ? "mac-app" : ""} ${page === "Foco" ? "in-focus" : ""}`}
    >
      <aside className="sidebar">
        <button
          className="brand"
          aria-label="Orbit — Hoje"
          onClick={() => setPage("Hoje")}
        >
          <Orbit size={25} strokeWidth={1.4} />
          <span>Orbit</span>
          <span className="desktop-tag">ESTUDO</span>
        </button>
        <button className="sidebar-new" onClick={() => setEditing(null)}>
          <Plus size={16} />
          Nova tarefa<kbd>N</kbd>
        </button>
        <nav aria-label="Navegação principal">
          {pages.map(({ name, icon: Icon }) => (
            <button
              key={name}
              aria-label={name}
              className={`nav-item ${page === name ? "active" : ""}`}
              aria-current={page === name ? "page" : undefined}
              onClick={() => setPage(name)}
            >
              <Icon size={17} strokeWidth={1.7} />
              <span>{name}</span>
              {name === "Radar" && risks.length > 0 && (
                <span className="nav-count">{risks.length}</span>
              )}
              {name === "Foco" && session && <i className="live-dot" />}
            </button>
          ))}
        </nav>
        <div className="subjects-heading">
          <span>MATÉRIAS</span>
          <button
            className="icon-button"
            aria-label="Criar matéria"
            onClick={() => setSubjectModal(true)}
          >
            <Plus size={13} />
          </button>
        </div>
        <div className="subjects-list">
          {data.subjects.map((s) => (
            <button
              key={s.id}
              title={s.name}
              onClick={() => {
                setSubjectFilter(s.id);
                setPage("To-do");
              }}
            >
              <i style={{ background: s.color }} />
              <span>{s.name}</span>
            </button>
          ))}
        </div>
        <div className="sidebar-bottom">
          <button
            className="sidebar-command"
            aria-label="Abrir ações rápidas"
            onClick={() => setPalette(true)}
          >
            <Search size={15} />
            <span>Ações rápidas</span>
            <kbd>{/Mac/.test(navigator.platform) ? "⌘" : "Ctrl"} K</kbd>
          </button>
          <div className="sidebar-settings">
            <button
              className="icon-button"
              aria-label="Configurações"
              onClick={() => setSettings(true)}
            >
              <Settings2 size={16} />
            </button>
            <span>{data.settings.name}</span>
            <button
              className="icon-button"
              aria-label="Alternar tema"
              onClick={toggleTheme}
            >
              {data.theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </aside>
      <main>
        <header className="topbar" data-tauri-drag-region>
          <span className="desktop-page-label" data-tauri-drag-region>
            {page}
          </span>
          <span className="topbar-date" data-tauri-drag-region>
            {now.toLocaleDateString("pt-BR", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
          </span>
          <button
            className="command-trigger"
            aria-label="Abrir ações rápidas"
            onClick={() => setPalette(true)}
          >
            <Search size={15} />
            <kbd>{/Mac/.test(navigator.platform) ? "⌘" : "Ctrl"} K</kbd>
          </button>
          <button className="button small" onClick={() => setEditing(null)}>
            <Plus size={14} />
            Nova tarefa
          </button>
        </header>
        {error && (
          <div className="storage-error" role="alert">
            {error}
            {!canSave && (
              <button onClick={enableSaving}>Substituir pelo exemplo</button>
            )}
          </div>
        )}
        <div className="page-content" key={page}>
          {page === "Hoje" && (
            <TodayPage
              data={data}
              plan={plan}
              recommended={recommended}
              risks={risks}
              completed={completed}
              greeting={greeting}
              subject={subject}
              replan={replan}
              start={start}
              onDefer={postpone}
              onDebug={openDebug}
              onTime={() => {
                setAvailable(data.dailyMinutes);
                setTimeModal(true);
              }}
              onTasks={() => {
                setSubjectFilter("all");
                setPage("To-do");
              }}
              onRadar={() => setPage("Radar")}
              availableMinutes={availableMinutes}
            />
          )}{" "}
          {page === "To-do" && (
            <TodoPage
              data={data}
              filter={filter}
              setFilter={setFilter}
              search={search}
              setSearch={setSearch}
              subjectFilter={subjectFilter}
              setSubjectFilter={setSubjectFilter}
              row={row}
              setEditing={setEditing}
              setSubjectModal={setSubjectModal}
            />
          )}{" "}
          {page === "Radar" && (
            <RadarPage
              data={data}
              now={now}
              row={row}
              setSubjectFilter={setSubjectFilter}
              setPage={setPage}
            />
          )}{" "}
          {page === "Foco" && (
            <FocusPage
              activeTask={activeTask}
              session={session}
              subject={subject}
              actualSeconds={elapsed}
              pause={pause}
              resume={resume}
              onComplete={() => {
                if (!activeTask) return;
                setCompletion(activeTask.title);
                toggleTask(activeTask.id);
              }}
              onEnd={() => {
                endFocus();
                setPage("Hoje");
                setNotice("Sessão registrada. Sua tarefa continua pendente.");
              }}
              openDebug={() => activeTask && openDebug(activeTask)}
              recommended={recommended}
              start={start}
              onTasks={() => setPage("To-do")}
              completion={completion}
            />
          )}
        </div>
      </main>
      {editing !== undefined && (
        <TaskForm
          task={editing ?? undefined}
          subjects={data.subjects}
          onClose={() => setEditing(undefined)}
          onSave={saveTask}
        />
      )}
      {subjectModal && (
        <Modal title="Uma nova matéria" onClose={() => setSubjectModal(false)}>
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!subjectName.trim()) return;
              const s: Subject = {
                id: crypto.randomUUID(),
                name: subjectName.trim(),
                color: subjectColor,
              };
              update((d) => ({ ...d, subjects: [...d.subjects, s] }));
              setSubjectName("");
              setSubjectModal(false);
              setNotice("Matéria adicionada ao seu espaço.");
            }}
          >
            <label>
              Nome da matéria
              <input
                autoFocus
                required
                maxLength={70}
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="Ex.: Cálculo"
              />
            </label>
            <fieldset>
              <legend>Uma cor para identificar</legend>
              <div className="color-picker">
                {[
                  "#b8b4e9",
                  "#dabf8d",
                  "#92c6bc",
                  "#cf9daa",
                  "#9bbbd8",
                  "#c3e7b7",
                ].map((c) => (
                  <button
                    type="button"
                    key={c}
                    aria-label={`Cor ${c}`}
                    aria-pressed={subjectColor === c}
                    style={{ background: c }}
                    onClick={() => setSubjectColor(c)}
                  >
                    {subjectColor === c && <Check size={18} />}
                  </button>
                ))}
              </div>
            </fieldset>
            <button className="button primary">Criar matéria</button>
          </form>
        </Modal>
      )}
      {deleting && (
        <Modal title="Excluir esta tarefa?" onClose={() => setDeleting(null)}>
          <p className="modal-copy">
            “{deleting.title}” será removida do seu espaço.
          </p>
          <div className="modal-actions">
            <button className="button" onClick={() => setDeleting(null)}>
              Cancelar
            </button>
            <button
              className="button danger"
              onClick={() => {
                deleteTask(deleting.id);
                setDeleting(null);
                setNotice("Tarefa excluída.");
              }}
            >
              Excluir tarefa
            </button>
          </div>
        </Modal>
      )}
      {timeModal && (
        <Modal
          title="Quanto tempo cabe no seu dia?"
          onClose={() => setTimeModal(false)}
        >
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault();
              update((d) => ({ ...d, dailyMinutes: available }));
              setTimeModal(false);
              setNotice("Tempo atualizado. Sua rota já foi ajustada.");
            }}
          >
            <p className="muted">
              Reserve um tempo realista. Também precisa haver espaço para
              descansar.
            </p>
            <label>
              Minutos disponíveis
              <input
                autoFocus
                type="number"
                min={10}
                max={1440}
                required
                value={available}
                onChange={(e) => setAvailable(Number(e.target.value))}
              />
            </label>
            <button className="button primary">Ajustar minha rota</button>
          </form>
        </Modal>
      )}

      {palette && (
        <CommandPalette commands={commands} onClose={() => setPalette(false)} />
      )}
      {settings && (
        <SettingsPanel
          data={data}
          onSave={(next) => update(() => next)}
          onReplace={(next) => {
            update(() => next);
            setCompletion(null);
            setNotice("Cópia importada. Sua rota está pronta.");
          }}
          onClose={() => setSettings(false)}
        />
      )}
      {debugTask && (
        <DebuggerPanel
          selected={blocker}
          onSelect={(reason) => {
            setBlocker(reason);
            selectReason(stuckEventId, reason);
          }}
          onClose={() => setDebugTask(null)}
          onShort={shortSession}
          onDivide={divide}
          onReplan={() => {
            const task = debugTask;
            setDebugTask(null);
            postpone(task);
          }}
        />
      )}
      {comparison && (
        <RouteComparison
          before={comparison.before}
          after={comparison.after}
          onClose={() => setComparison(null)}
        />
      )}
      {notice && (
        <div className="toast" role="status">
          <Check size={16} />
          {notice}
          <button
            className="icon-button"
            aria-label="Fechar aviso"
            onClick={() => setNotice("")}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
