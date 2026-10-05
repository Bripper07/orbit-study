import { TodayPage } from "./pages/TodayPage";
import { TodoPage } from "./pages/TodoPage";
import { RadarPage } from "./pages/RadarPage";
import { FocusPage } from "./pages/FocusPage";
import { useEffect, useState } from "react";
import {
  Orbit,
  House,
  ListTodo,
  Radar,
  ScanLine,
  Plus,
  Sun,
  Moon,
  ArrowRight,
  Check,
  ChevronRight,
  Sprout,
  X,
} from "lucide-react";
import { elapsedFocusSeconds } from "./domain/focus";
import type { Subject, Task, Page } from "./types";
import { useOrbit } from "./hooks/useOrbit";
import {
  calculateTaskRisk,
  dateKey,
  generateDailyPlan,
  getRecommendedTask,
  replanDay,
} from "./domain/planner";
import { blockers } from "./domain/debugger";
import { Modal } from "./components/Modal";
import { TaskForm } from "./components/TaskForm";
import { TaskRow } from "./components/TaskRow";

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
    error,
    canSave,
    enableSaving,
  } = useOrbit();
  const [page, setPage] = useState<Page>("Hoje");
  const [editing, setEditing] = useState<Task | null | undefined>();
  const [subjectModal, setSubjectModal] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [subjectColor, setSubjectColor] = useState("#b8b4e9");
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [debug, setDebug] = useState(false);
  const [blocker, setBlocker] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("pending");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [clock, setClock] = useState(Date.now());
  const [timeModal, setTimeModal] = useState(false);
  const [available, setAvailable] = useState(data.dailyMinutes);
  const now = new Date(clock);
  const plan = generateDailyPlan(
    data.tasks,
    data.dailyMinutes,
    now,
    data.deferredIds,
  );
  const recommended = getRecommendedTask(plan);
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
  const activeTask = data.tasks.find(
    (t) => t.id === data.focus?.taskId && t.status === "pending",
  );
  const session = activeTask ? data.focus : null;
  const elapsed = elapsedFocusSeconds(session, clock);
  const remaining = session
    ? Math.max(0, session.durationSeconds - elapsed)
    : 0;
  const progress = session
    ? Math.min(100, (elapsed / session.durationSeconds) * 100)
    : 0;
  useEffect(() => {
    document.documentElement.dataset.theme = data.theme;
  }, [data.theme]);
  useEffect(() => {
    const id = window.setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(id);
  }, [notice]);
  useEffect(() => {
    if (session?.runningSince !== null && session && remaining === 0)
      update((d) => ({
        ...d,
        focus: d.focus
          ? {
              ...d.focus,
              elapsedSeconds: d.focus.durationSeconds,
              runningSince: null,
            }
          : null,
      }));
  }, [remaining, session, update]);
  function start(task: Task) {
    if (session && session.taskId !== task.id) {
      setNotice("Encerre a sessão atual antes de iniciar outra tarefa.");
      setPage("Foco");
      return;
    }
    update((d) => ({
      ...d,
      focus:
        d.focus?.taskId === task.id
          ? d.focus
          : {
              taskId: task.id,
              durationSeconds: task.estimatedMinutes * 60,
              elapsedSeconds: 0,
              runningSince: Date.now(),
            },
    }));
    setClock(Date.now());
    setPage("Foco");
  }
  function pause() {
    update((d) => ({
      ...d,
      focus: d.focus
        ? { ...d.focus, elapsedSeconds: elapsed, runningSince: null }
        : null,
    }));
  }
  function replan() {
    const result = replanDay(data.tasks, data.dailyMinutes, now);
    update((d) => ({ ...d, deferredIds: [] }));
    setNotice(
      `Rota recalculada: ${result.today.length} tarefas cabem no seu dia. Os prazos continuam iguais.`,
    );
  }
  function row(task: Task, index?: number) {
    return (
      <TaskRow
        key={task.id}
        task={task}
        index={index}
        subject={subject(task.subjectId)}
        onToggle={() => toggleTask(task.id)}
        onStart={() => start(task)}
        onEdit={() => setEditing(task)}
        onDelete={() => setDeleting(task)}
      />
    );
  }
  function openDebug() {
    pause();
    setBlocker(null);
    setDebug(true);
  }
  function applyBlocker() {
    if (blocker === null || !activeTask) return;
    const selected = blockers[blocker];
    if (selected.type === "short") {
      update((d) => ({
        ...d,
        focus: {
          taskId: activeTask.id,
          durationSeconds: 600,
          elapsedSeconds: 0,
          runningSince: Date.now(),
        },
      }));
      setNotice("Uma sessão de 10 minutos. Só o próximo passo.");
    } else if (selected.type === "defer") {
      update((d) => ({
        ...d,
        focus: null,
        deferredIds: [
          ...d.deferredIds.filter((id) => id !== activeTask.id),
          activeTask.id,
        ],
      }));
      setPage("Hoje");
      setNotice("Tarefa movida para depois na rota. O prazo foi mantido.");
    } else {
      setEditing({
        ...activeTask,
        id: crypto.randomUUID(),
        title:
          selected.type === "info"
            ? `Descobrir o que falta: ${activeTask.title}`
            : `Primeiro passo: ${activeTask.title}`,
        description: `Parte de: ${activeTask.title}\n${selected.suggestion}`,
        estimatedMinutes: 10,
        status: "pending",
        createdAt: new Date().toISOString(),
        completedAt: undefined,
      });
    }
    setDebug(false);
  }
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setPage("Hoje");
          }}
        >
          <Orbit size={29} strokeWidth={1.5} />
          <span>
            orbit<span className="brand-dot">.</span>
          </span>
        </a>
        <div className="workspace-label">SEU ESPAÇO DE ESTUDO</div>
        <nav aria-label="Navegação principal">
          {pages.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={`nav-item ${page === name ? "active" : ""}`}
              onClick={() => setPage(name)}
            >
              <Icon size={19} />
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
            aria-label="Criar matéria"
            className="icon-button"
            onClick={() => setSubjectModal(true)}
          >
            <Plus size={15} />
          </button>
        </div>
        <div className="subjects-list">
          {data.subjects.map((s) => (
            <button
              key={s.id}
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
          <div className="quiet-note">
            <Sprout size={20} />
            <p>
              Um passo de cada vez.
              <br />
              <span>Você não precisa fazer tudo hoje.</span>
            </p>
          </div>
          <button
            className="theme-switch"
            onClick={() =>
              update((d) => ({
                ...d,
                theme: d.theme === "dark" ? "light" : "dark",
              }))
            }
          >
            {data.theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            <span>{data.theme === "dark" ? "Modo claro" : "Modo escuro"}</span>
          </button>
          <div className="profile">
            <span className="avatar">B</span>
            <div>
              <strong>Bruno</strong>
              <span>Meu espaço pessoal</span>
            </div>
            <span className="profile-dot" />
          </div>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <div>
            <span className="breadcrumb">Meu espaço</span>
            <ChevronRight size={14} />
            <span>{page}</span>
          </div>
          <span className="topbar-date">
            {now.toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </span>
          <button
            className="icon-button mobile-theme"
            aria-label="Alternar tema"
            onClick={() =>
              update((d) => ({
                ...d,
                theme: d.theme === "dark" ? "light" : "dark",
              }))
            }
          >
            {data.theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button className="button small" onClick={() => setEditing(null)}>
            <Plus size={16} />
            Nova tarefa
          </button>
        </header>
        {error && (
          <div className="storage-error" role="alert">
            {error}
            {!canSave && (
              <button onClick={enableSaving}>
                Substituir dados locais pelo exemplo
              </button>
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
              setAvailable={setAvailable}
              setTimeModal={setTimeModal}
              start={start}
              setEditing={setEditing}
              setSubjectFilter={setSubjectFilter}
              setPage={setPage}
              row={row}
            />
          )}
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
          )}
          {page === "Radar" && (
            <RadarPage
              data={data}
              plan={plan}
              now={now}
              risks={risks}
              row={row}
              setSubjectFilter={setSubjectFilter}
              setPage={setPage}
            />
          )}
          {page === "Foco" && (
            <FocusPage
              activeTask={activeTask}
              session={session}
              subject={subject}
              remaining={remaining}
              progress={progress}
              pause={pause}
              update={update}
              toggleTask={toggleTask}
              setNotice={setNotice}
              setPage={setPage}
              openDebug={openDebug}
              recommended={recommended}
              start={start}
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
      {debug && (
        <Modal title="O que está acontecendo?" onClose={() => setDebug(false)}>
          <p className="modal-copy">
            Travou? Vamos diminuir o próximo passo. Seu timer está pausado.
          </p>
          <div className="blocker-options">
            {blockers.map((b, i) => (
              <button
                key={b.title}
                className={blocker === i ? "selected" : ""}
                onClick={() => setBlocker(i)}
              >
                <span>{b.title}</span>
                <ChevronRight size={17} />
              </button>
            ))}
          </div>
          {blocker !== null && (
            <div className="debug-suggestion">
              <Sprout size={22} />
              <p>{blockers[blocker].suggestion}</p>
              <button className="button primary" onClick={applyBlocker}>
                {blockers[blocker].action}
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </Modal>
      )}
      {notice && (
        <div className="toast" role="status">
          <Check size={17} />
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
