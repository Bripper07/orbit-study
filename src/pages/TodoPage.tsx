import type { AppData, Task } from "../types";
import type { ReactNode } from "react";
import { ListTodo, Plus } from "lucide-react";
interface Props {
  data: AppData;
  filter: string;
  setFilter: (value: string) => void;
  search: string;
  setSearch: (value: string) => void;
  subjectFilter: string;
  setSubjectFilter: (value: string) => void;
  row: (task: Task, index?: number) => ReactNode;
  setEditing: (task: Task | null) => void;
  setSubjectModal: (open: boolean) => void;
}
export function TodoPage({
  data,
  filter,
  setFilter,
  search,
  setSearch,
  subjectFilter,
  setSubjectFilter,
  row,
  setEditing,
  setSubjectModal,
}: Props) {
  const matches = data.tasks.filter(
    (t) =>
      (filter === "all" || t.status === filter) &&
      (subjectFilter === "all" || t.subjectId === subjectFilter) &&
      t.title.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">UM LUGAR PARA TIRAR DA CABEÇA</div>
          <h1>
            Seus próximos passos<span className="greeting-dot">.</span>
          </h1>
          <p>Organize o que precisa acontecer. A rota cuida da ordem.</p>
        </div>
        <button className="button primary" onClick={() => setEditing(null)}>
          <Plus size={17} />
          Nova tarefa
        </button>
      </div>
      <div className="toolbar">
        <div className="filter-tabs">
          <button
            className={filter === "pending" ? "selected" : ""}
            onClick={() => setFilter("pending")}
          >
            Pendentes{" "}
            <span>
              {data.tasks.filter((t) => t.status === "pending").length}
            </span>
          </button>
          <button
            className={filter === "completed" ? "selected" : ""}
            onClick={() => setFilter("completed")}
          >
            Concluídas
          </button>
          <button
            className={filter === "all" ? "selected" : ""}
            onClick={() => setFilter("all")}
          >
            Todas
          </button>
        </div>
        <input
          aria-label="Buscar tarefa"
          placeholder="Buscar tarefa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          aria-label="Filtrar matéria"
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
        >
          <option value="all">Todas as matérias</option>
          {data.subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div className="task-list">
        {data.subjects
          .filter((s) => matches.some((t) => t.subjectId === s.id))
          .map((s) => (
            <section key={s.id}>
              <h2 className="todo-subject-heading">
                <i style={{ background: s.color }} />
                {s.name}
              </h2>
              {matches.filter((t) => t.subjectId === s.id).map((t) => row(t))}
            </section>
          ))}
        {matches
          .filter((t) => !data.subjects.some((s) => s.id === t.subjectId))
          .map((t) => row(t))}
        {!data.tasks.some(
          (t) =>
            (filter === "all" || t.status === filter) &&
            (subjectFilter === "all" || t.subjectId === subjectFilter) &&
            t.title.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
        ) && (
          <div className="large-empty">
            <ListTodo size={32} />
            <h2>Nenhuma tarefa por aqui.</h2>
            <p>Crie um próximo passo ou ajuste os filtros.</p>
            <button className="button" onClick={() => setEditing(null)}>
              <Plus size={16} />
              Criar tarefa
            </button>
          </div>
        )}
      </div>
      <button
        className="text-button subject-create"
        onClick={() => setSubjectModal(true)}
      >
        <Plus size={16} />
        Adicionar matéria
      </button>
    </>
  );
}
