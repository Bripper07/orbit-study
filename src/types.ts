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
  id?: string;
  startedAt?: string;
}
export type BlockerReason =
  "start" | "large" | "tired" | "information" | "avoid";
export interface FocusRecord {
  id: string;
  taskId: string;
  taskTitle: string;
  subjectId: string;
  startedAt: string;
  endedAt: string;
  plannedSeconds: number;
  actualSeconds: number;
  outcome: "completed" | "ended" | "deferred";
}
export interface MemoryEvent {
  id: string;
  kind: "completed" | "deferred" | "stuck";
  taskId: string;
  subjectId: string;
  occurredAt: string;
  reason?: BlockerReason;
  estimatedMinutes?: number;
  actualSeconds?: number;
}
export interface OperationalMemory {
  sessions: FocusRecord[];
  events: MemoryEvent[];
}
export interface Settings {
  name: string;
  startTime: string;
  breakMinutes: number;
}
export interface AppData {
  version: 2;
  tasks: Task[];
  subjects: Subject[];
  dailyMinutes: number;
  deferredIds: string[];
  planDate: string;
  theme: "dark" | "light";
  focus: FocusSession | null;
  memory: OperationalMemory;
  settings: Settings;
  routeStartAt: string;
}

export type Page = "Hoje" | "To-do" | "Radar" | "Foco";
