import type { FocusSession } from "../types";
export function actualFocusSeconds(
  session: FocusSession | null,
  now = Date.now(),
): number {
  if (!session) return 0;
  return (
    session.elapsedSeconds +
    (session.runningSince === null
      ? 0
      : Math.max(0, Math.floor((now - session.runningSince) / 1000)))
  );
}
export function elapsedFocusSeconds(
  session: FocusSession | null,
  now = Date.now(),
): number {
  if (!session) return 0;
  const runningSeconds =
    session.runningSince === null
      ? 0
      : Math.max(0, Math.floor((now - session.runningSince) / 1000));
  return Math.min(
    session.durationSeconds,
    session.elapsedSeconds + runningSeconds,
  );
}
