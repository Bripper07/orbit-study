import { useState, type FormEvent } from "react";
import type { Subject, Task, Priority } from "../types";
import { dateKey } from "../domain/planner";
import { Modal } from "./Modal";
export function TaskForm({
  task,
  subjects,
  onSave,
  onClose,
}: {
  task?: Task;
  subjects: Subject[];
  onSave: (task: Task) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [subjectId, setSubject] = useState(
    task?.subjectId ?? subjects[0]?.id ?? "",
  );
  const [dueDate, setDue] = useState(task?.dueDate ?? dateKey());
  const [priority, setPriority] = useState<Priority>(
    task?.priority ?? "medium",
  );
  const [minutes, setMinutes] = useState(task?.estimatedMinutes ?? 30);
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !subjectId) return;
    onSave({
      ...task,
      id: task?.id ?? crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      subjectId,
      dueDate,
      priority,
      estimatedMinutes: minutes,
      status: task?.status ?? "pending",
      createdAt: task?.createdAt ?? new Date().toISOString(),
    });
    onClose();
  }
  return (
    <Modal
      title={task ? "Editar tarefa" : "Um novo próximo passo"}
      onClose={onClose}
    >
      <form onSubmit={submit} className="form">
        <label>
          O que você precisa fazer?
          <input
            autoFocus
            required
            maxLength={160}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex.: revisar funções em Python"
          />
        </label>
        <label>
          Matéria
          <select
            required
            value={subjectId}
            onChange={(e) => setSubject(e.target.value)}
          >
            <option value="" disabled>
              Selecione uma matéria
            </option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <div className="form-grid">
          <label>
            Prazo
            <input
              required
              type="date"
              value={dueDate}
              onChange={(e) => setDue(e.target.value)}
            />
          </label>
          <label>
            Tempo estimado (min)
            <input
              type="number"
              min={1}
              max={1440}
              required
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
            />
          </label>
        </div>
        <label>
          Prioridade
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
          >
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
          </select>
        </label>
        <label>
          Descrição <span className="muted">· opcional</span>
          <textarea
            rows={3}
            maxLength={2000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Anotações para facilitar o começo"
          />
        </label>
        <button className="button primary" type="submit">
          {task ? "Salvar alterações" : "Criar tarefa"}
        </button>
      </form>
    </Modal>
  );
}
