export type Priority = "low" | "medium" | "high";
export type Risk = "baixo" | "médio" | "alto";
export interface Subject {
  id: string;
  name: string;
  color: string;
}
export interface Task {
  id: string;
  title: string;
  description?: string;
  subjectId: string;
  dueDate: string;
  priority: Priority;
  estimatedMinutes: number;
  status: "pending" | "completed";
  createdAt: string;
  completedAt?: string;
}
export interface FocusSession {
  taskId: string;
  durationSeconds: number;
  elapsedSeconds: number;
  runningSince: number | null;
}
export interface AppData {
  version: 1;
  tasks: Task[];
  subjects: Subject[];
  dailyMinutes: number;
  deferredIds: string[];
  planDate: string;
  theme: "dark" | "light";
  focus: FocusSession | null;
}

export type Page = "Hoje" | "To-do" | "Radar" | "Foco";
