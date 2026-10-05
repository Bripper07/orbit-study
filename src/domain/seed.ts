import type { AppData } from "../types";
import { dateKey } from "./planner";
export function createSeed(): AppData {
  const due = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return dateKey(d);
  };
  const createdAt = new Date().toISOString();
  return {
    version: 1,
    theme: "dark",
    dailyMinutes: 180,
    deferredIds: [],
    planDate: dateKey(),
    focus: null,
    subjects: [
      { id: "python", name: "Modelagem e Programação", color: "#b8b4e9" },
      { id: "calc", name: "Cálculo", color: "#dabf8d" },
      { id: "adm", name: "Administração", color: "#92c6bc" },
    ],
    tasks: [
      {
        id: "1",
        title: "Estudar funções em Python",
        description:
          "Revisar parâmetros, retorno e escopo. Resolver os exemplos da aula.",
        subjectId: "python",
        dueDate: due(6),
        priority: "high",
        estimatedMinutes: 30,
        status: "pending",
        createdAt,
      },
      {
        id: "2",
        title: "Exercícios de while",
        subjectId: "python",
        dueDate: due(7),
        priority: "medium",
        estimatedMinutes: 25,
        status: "pending",
        createdAt,
      },
      {
        id: "3",
        title: "Revisar limites e continuidade",
        subjectId: "calc",
        dueDate: due(8),
        priority: "high",
        estimatedMinutes: 45,
        status: "pending",
        createdAt,
      },
      {
        id: "4",
        title: "Trabalho de ADM",
        description:
          "Organizar as referências e escrever a análise do estudo de caso.",
        subjectId: "adm",
        dueDate: due(3),
        priority: "low",
        estimatedMinutes: 120,
        status: "pending",
        createdAt,
      },
      {
        id: "5",
        title: "Ler o capítulo de derivadas",
        subjectId: "calc",
        dueDate: due(12),
        priority: "low",
        estimatedMinutes: 35,
        status: "pending",
        createdAt,
      },
      {
        id: "6",
        title: "Organizar anotações da aula",
        subjectId: "python",
        dueDate: due(1),
        priority: "low",
        estimatedMinutes: 15,
        status: "completed",
        createdAt,
        completedAt: createdAt,
      },
    ],
  };
}
