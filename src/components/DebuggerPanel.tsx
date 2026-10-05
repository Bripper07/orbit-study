import { ArrowRight, Footprints, Scissors, RotateCw } from "lucide-react";
import { Modal } from "./Modal";
import type { BlockerReason } from "../types";
import { reasons } from "../domain/debugger";
export function DebuggerPanel({
  selected,
  onSelect,
  onClose,
  onShort,
  onDivide,
  onReplan,
}: {
  selected: BlockerReason | null;
  onSelect: (reason: BlockerReason) => void;
  onClose: () => void;
  onShort: () => void;
  onDivide: () => void;
  onReplan: () => void;
}) {
  const current = reasons.find((r) => r[0] === selected);
  return (
    <Modal title="O que está te impedindo de continuar?" onClose={onClose}>
      <p className="modal-copy">
        Você não precisa resolver tudo de uma vez. Vamos encontrar um passo
        possível.
      </p>
      <div className="blocker-options">
        {reasons.map(([id, title]) => (
          <button
            key={id}
            className={selected === id ? "selected" : ""}
            aria-pressed={selected === id}
            onClick={() => onSelect(id)}
          >
            <span>{title}</span>
            <ArrowRight size={15} />
          </button>
        ))}
      </div>
      {current && (
        <div className="debug-suggestion">
          <Footprints size={21} />
          <p>{current[2]}</p>
          <button
            className="button primary"
            onClick={
              selected === "information"
                ? onDivide
                : selected === "avoid"
                  ? onReplan
                  : onShort
            }
          >
            <ArrowRight size={16} />
            {selected === "information"
              ? "Descobrir o que falta"
              : selected === "avoid"
                ? "Ajustar minha rota"
                : "Começar 10 min"}
          </button>
          <div className="debug-secondary">
            <button className="text-button" onClick={onDivide}>
              <Scissors size={14} />
              Dividir tarefa
            </button>
            <button className="text-button" onClick={onReplan}>
              <RotateCw size={14} />
              Replanejar
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
