import { useEffect, useState, useCallback, useRef } from "react";
import type { AppData, Task, BlockerReason } from "../types";
import {
  resolveRepository,
  type AsyncDataRepository,
} from "../storage/desktopRepository";
import { createSeed } from "../domain/seed";
import { dateKey } from "../domain/planner";
import { routeStart } from "../domain/timeline";
import {
  archiveFocus,
  completeTask,
  deferTask,
  memoryEvent,
} from "../domain/memory";
export function useOrbit() {
  const [data, setData] = useState<AppData>(createSeed);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [canSave, setCanSave] = useState(false);
  const repo = useRef<AsyncDataRepository | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const current = useRef(data);
  current.current = data;
  useEffect(() => {
    let active = true;
    resolveRepository()
      .then(async (repository) => {
        const initial = await repository.load();
        if (active) {
          repo.current = repository;
          setData(initial);
          setCanSave(true);
        }
      })
      .catch(() => {
        if (active)
          setError(
            "Não foi possível ler seus dados. O exemplo está aberto; seus dados anteriores foram preservados. Exporte uma cópia antes de substituí-los.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  const persist = useCallback((value: AppData) => {
    const repository = repo.current;
    if (!repository)
      return Promise.reject(new Error("Armazenamento indisponível"));
    queue.current = queue.current
      .catch(() => {})
      .then(() => repository.save(value));
    return queue.current;
  }, []);
  useEffect(() => {
    if (loading || !canSave) return;
    persist(data)
      .then(() => setError(""))
      .catch(() =>
        setError(
          "Não foi possível salvar seus dados. Mantenha o Orbit aberto e exporte uma cópia em Configurações.",
        ),
      );
  }, [data, loading, canSave, persist]);
  useEffect(() => {
    const id = setInterval(
      () =>
        setData((d) =>
          d.planDate === dateKey()
            ? d
            : {
                ...d,
                planDate: dateKey(),
                deferredIds: [],
                routeStartAt: routeStart(d.settings.startTime),
              },
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
    update((d) =>
      d.tasks.find((t) => t.id === id)?.status === "pending"
        ? completeTask(d, id)
        : {
            ...d,
            tasks: d.tasks.map((t) =>
              t.id === id
                ? { ...t, status: "pending", completedAt: undefined }
                : t,
            ),
          },
    );
  const deleteTask = (id: string) =>
    update((d) => {
      const next = d.focus?.taskId === id ? archiveFocus(d, "ended") : d;
      return {
        ...next,
        tasks: next.tasks.filter((t) => t.id !== id),
        deferredIds: next.deferredIds.filter((t) => t !== id),
      };
    });
  const startFocus = (task: Task, minutes = task.estimatedMinutes) =>
    update((d) => {
      if (d.focus?.taskId === task.id) return d;
      if (d.focus) return d;
      return {
        ...d,
        focus: {
          id: crypto.randomUUID(),
          taskId: task.id,
          startedAt: new Date().toISOString(),
          durationSeconds: minutes * 60,
          elapsedSeconds: 0,
          runningSince: Date.now(),
        },
      };
    });
  const endFocus = () => update((d) => archiveFocus(d, "ended"));
  const defer = (id: string) => update((d) => deferTask(d, id));
  const logStuck = (task: Task) => {
    const event = memoryEvent(task, "stuck");
    update((d) => ({
      ...d,
      memory: { ...d.memory, events: [...d.memory.events, event] },
    }));
    return event.id;
  };
  const selectReason = (eventId: string, reason: BlockerReason) =>
    update((d) => ({
      ...d,
      memory: {
        ...d.memory,
        events: d.memory.events.map((e) =>
          e.id === eventId ? { ...e, reason } : e,
        ),
      },
    }));
  const flush = useCallback(() => persist(current.current), [persist]);
  const enableSaving = async () => {
    try {
      repo.current = await resolveRepository();
      setCanSave(true);
    } catch {
      setError(
        "Armazenamento indisponível. Exporte seus dados e tente abrir o app novamente.",
      );
    }
  };
  return {
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
  };
}
