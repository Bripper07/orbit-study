import type { TimelineItem } from "../domain/timeline";
import { compareRoutes, timeLabel } from "../domain/timeline";
import { Modal } from "./Modal";
import { ArrowRight, Check } from "lucide-react";
export function RouteComparison({
  before,
  after,
  onClose,
}: {
  before: TimelineItem[];
  after: TimelineItem[];
  onClose: () => void;
}) {
  const changes = compareRoutes(before, after);
  const removed = before.filter(
    (i) => i.kind === "task" && !after.some((a) => a.id === i.id),
  );
  const changed = changes.some((c) => c.changed) || removed.length > 0;
  return (
    <Modal
      title={
        changed
          ? "Sua rota foi recalculada"
          : "Sua rota continua fazendo sentido"
      }
      onClose={onClose}
    >
      <p className="modal-copy">
        {changed
          ? "Ajustamos os próximos passos ao tempo que você tem agora."
          : "A ordem das tarefas foi mantida. Você já tem um bom próximo passo."}{" "}
        Os prazos foram mantidos.
      </p>
      <div className="route-comparison">
        <div className="comparison-head">
          <span>ANTES</span>
          <ArrowRight size={14} />
          <span>AGORA</span>
        </div>
        {changes.map(({ item, previous, changed }) => (
          <div className={changed ? "changed" : ""} key={item.id}>
            <span>
              {previous ? timeLabel(previous.startAt) : "Fora da rota"}
            </span>
            <ArrowRight size={13} />
            <span>{timeLabel(item.startAt)}</span>
            <strong>{item.task?.title}</strong>
          </div>
        ))}
        {removed.map((item) => (
          <div key={item.id}>
            <span>{timeLabel(item.startAt)}</span>
            <ArrowRight size={13} />
            <span>No To-do</span>
            <strong>{item.task?.title}</strong>
          </div>
        ))}
      </div>
      <button className="button primary full-width" onClick={onClose}>
        <Check size={16} />
        Seguir minha rota
      </button>
    </Modal>
  );
}
