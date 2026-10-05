import { useEffect, useState, useCallback } from "react";
import type { AppData, Task } from "../types";
import { localRepository } from "../storage/repository";
import { createSeed } from "../domain/seed";
import { dateKey } from "../domain/planner";
export function useOrbit() {
  const [initial] = useState(() => {
    try {
      return { data: localRepository.load(), error: "" };
    } catch {
      return {
        data: createSeed(),
        error:
          "Não foi possível ler seus dados locais. O exemplo está aberto; os dados antigos serão preservados até você escolher substituí-los.",
      };
    }
  });
  const [data, setData] = useState<AppData>(initial.data);
  const [error, setError] = useState(initial.error);
  const [canSave, setCanSave] = useState(!initial.error);
  useEffect(() => {
    if (!canSave) return;
    try {
      localRepository.save(data);
      setError("");
    } catch {
      setError(
        "Não foi possível salvar neste navegador. Suas alterações estão disponíveis apenas nesta sessão.",
      );
    }
  }, [data, canSave]);
  useEffect(() => {
    const id = window.setInterval(
      () =>
        setData((d) =>
          d.planDate === dateKey()
            ? d
            : { ...d, planDate: dateKey(), deferredIds: [] },
        ),
      30000,
    );
    return () => clearInterval(id);
  }, []);
  const update = useCallback((fn: (d: AppData) => AppData) => setData(fn), []);
  const saveTask = (task: Task) =>
    update((d) => ({
      ...d,
      tasks: d.tasks.some((t) => t.id === task.id)
        ? d.tasks.map((t) => (t.id === task.id ? task : t))
        : [...d.tasks, task],
    }));
  const toggleTask = (id: string) =>
    update((d) => ({
      ...d,
      focus: d.focus?.taskId === id ? null : d.focus,
      tasks: d.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              status: t.status === "pending" ? "completed" : "pending",
              completedAt:
                t.status === "pending" ? new Date().toISOString() : undefined,
            }
          : t,
      ),
    }));
  const deleteTask = (id: string) =>
    update((d) => ({
      ...d,
      tasks: d.tasks.filter((t) => t.id !== id),
      focus: d.focus?.taskId === id ? null : d.focus,
      deferredIds: d.deferredIds.filter((t) => t !== id),
    }));
  return {
    data,
    update,
    saveTask,
    toggleTask,
    deleteTask,
    error,
    canSave,
    enableSaving: () => setCanSave(true),
  };
}
