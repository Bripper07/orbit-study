import { describe, expect, it } from "vitest";
import type { Task } from "../types";
import {
  calculateTaskRisk,
  daysUntil,
  generateDailyPlan,
  getRecommendedTask,
  replanDay,
} from "./planner";
const now = new Date(2026, 9, 5, 23, 30);
const task = (overrides: Partial<Task> = {}): Task => ({
  id: "1",
  title: "Estudar",
  subjectId: "s",
  dueDate: "2026-10-10",
  priority: "medium",
  estimatedMinutes: 30,
  status: "pending",
  createdAt: "2026-10-01T10:00:00Z",
  ...overrides,
});
describe("risco e datas", () => {
  it("calcula dias de calendário sem depender do horário", () => {
    expect(daysUntil("2026-10-06", now)).toBe(1);
    expect(daysUntil("2026-10-04", now)).toBe(-1);
  });
  it("prioriza atrasadas e prazos imediatos", () => {
    expect(calculateTaskRisk(task({ dueDate: "2026-10-04" }), now)).toBe(
      "alto",
    );
    expect(
      calculateTaskRisk(task({ dueDate: "2026-10-06", priority: "low" }), now),
    ).toBe("alto");
  });
  it("considera esforço e prioridade em prazos curtos", () => {
    expect(
      calculateTaskRisk(
        task({ dueDate: "2026-10-08", estimatedMinutes: 120 }),
        now,
      ),
    ).toBe("alto");
    expect(calculateTaskRisk(task(), now)).toBe("médio");
    expect(calculateTaskRisk(task({ dueDate: "2026-11-01" }), now)).toBe(
      "baixo",
    );
  });
  it("tarefas concluídas não têm risco", () =>
    expect(
      calculateTaskRisk(
        task({ dueDate: "2026-10-01", status: "completed" }),
        now,
      ),
    ).toBe("baixo"));
});
describe("rota diária", () => {
  it("ordena por atraso, prazo e prioridade sem alterar os dados", () => {
    const items = [
      task({ id: "b" }),
      task({ id: "a", dueDate: "2026-10-04" }),
      task({ id: "c", priority: "high" }),
    ];
    const before = JSON.stringify(items);
    expect(generateDailyPlan(items, 180, now).ordered.map((t) => t.id)).toEqual(
      ["a", "c", "b"],
    );
    expect(JSON.stringify(items)).toBe(before);
  });
  it("exclui concluídas e respeita o orçamento de minutos", () => {
    const plan = generateDailyPlan(
      [
        task({ id: "a", estimatedMinutes: 120 }),
        task({ id: "b", estimatedMinutes: 20 }),
        task({ id: "c", status: "completed" }),
      ],
      30,
      now,
    );
    expect(plan.today.map((t) => t.id)).toEqual(["b"]);
    expect(plan.later.map((t) => t.id)).toEqual(["a"]);
    expect(plan.plannedMinutes).toBe(20);
    expect(plan.feasibility).toBe(21);
  });
  it("retorna estado vazio e nenhum recomendado quando nada cabe", () => {
    expect(generateDailyPlan([], 30, now).feasibility).toBe(100);
    expect(getRecommendedTask(generateDailyPlan([task()], 10, now))).toBeNull();
  });
  it("replaneja sem mover prazos e coloca adiadas depois", () => {
    const items = [task({ id: "a", dueDate: "2026-10-04" }), task({ id: "b" })];
    const plan = replanDay(items, 100, now, ["a"]);
    expect(plan.ordered.map((t) => t.id)).toEqual(["b", "a"]);
    expect(items[0].dueDate).toBe("2026-10-04");
  });
  it("prefere sessões menores quando prazo e prioridade são iguais", () =>
    expect(
      generateDailyPlan(
        [
          task({ id: "long", estimatedMinutes: 90 }),
          task({ id: "short", estimatedMinutes: 10 }),
        ],
        100,
        now,
      ).today[0].id,
    ).toBe("short"));
});
