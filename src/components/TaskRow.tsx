import { Check, Play, Pencil, Trash2, Clock3 } from "lucide-react";
import type { Subject, Task } from "../types";
import { calculateTaskRisk, deadlineLabel } from "../domain/planner";
export function TaskRow({
  task,
  subject,
  onToggle,
  onStart,
  onEdit,
  onDelete,
  index,
}: {
  task: Task;
  subject?: Subject;
  onToggle: () => void;
  onStart: () => void;
  onEdit: () => void;
  onDelete: () => void;
  index?: number;
}) {
  const done = task.status === "completed";
  const risk = calculateTaskRisk(task);
  return (
    <div className={`task-row ${done ? "done" : ""}`}>
      <button
        className={`check-button ${done ? "checked" : ""}`}
        onClick={onToggle}
        aria-label={done ? `Reabrir ${task.title}` : `Concluir ${task.title}`}
      >
        {done ? (
          <Check size={14} />
        ) : index !== undefined ? (
          <span>{String(index + 1).padStart(2, "0")}</span>
        ) : null}
      </button>
      <div className="task-info">
        <h3>{task.title}</h3>
        <div className="task-meta">
          <span className="subject-label">
            <i style={{ background: subject?.color }} />
            {subject?.name ?? "Sem matéria"}
          </span>
          <span>{deadlineLabel(task)}</span>
        </div>
      </div>
      <span
        className={`risk ${risk === "alto" ? "high" : risk === "médio" ? "medium" : "low"}`}
      >
        {done ? "Concluída" : `Risco ${risk}`}
      </span>
      <span className="duration">
        <Clock3 size={14} />
        {task.estimatedMinutes} min
      </span>
      {!done && (
        <span className={`priority-tag priority-${task.priority}`}>
          {task.priority === "high"
            ? "Alta"
            : task.priority === "medium"
              ? "Média"
              : "Baixa"}
        </span>
      )}
      <div className="row-actions">
        {!done && (
          <button
            className="icon-button"
            onClick={onStart}
            aria-label={`Iniciar ${task.title}`}
          >
            <Play size={16} />
          </button>
        )}
        <button
          className="icon-button"
          onClick={onEdit}
          aria-label={`Editar ${task.title}`}
        >
          <Pencil size={15} />
        </button>
        <button
          className="icon-button"
          onClick={onDelete}
          aria-label={`Excluir ${task.title}`}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
