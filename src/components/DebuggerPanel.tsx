import { ArrowRight, Footprints, Scissors, RotateCw } from "lucide-react";
import { Modal } from "./Modal";
import type { BlockerReason } from "../types";
const reasons: [BlockerReason, string, string][] = [
  [
    "start",
    "Não sei como começar",
    "Vamos reduzir o primeiro passo. Trabalhe nisso por apenas 10 minutos.",
  ],
  [
    "large",
    "Está grande demais",
    "Separe em entender, praticar e revisar. Comece pela parte mais simples.",
  ],
  [
    "tired",
    "Estou cansado",
    "Uma sessão pequena pode ser suficiente. Ou reserve esse passo para outro momento.",
  ],
  [
    "information",
    "Está faltando informação",
    "Antes de resolver, descubra o que falta. Transforme a dúvida em uma tarefa de 10 minutos.",
  ],
  [
    "avoid",
    "Não quero fazer isso agora",
    "Vamos trocar a ordem dos próximos passos, mantendo os prazos.",
  ],
];
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
