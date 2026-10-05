import { useState, useRef, useEffect } from "react";
import { Search, ArrowUpRight } from "lucide-react";
import { Modal } from "./Modal";
export interface Command {
  id: string;
  label: string;
  hint?: string;
  run: () => void;
}
export function CommandPalette({
  commands,
  onClose,
}: {
  commands: Command[];
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const matches = commands.filter((c) =>
    c.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  );
  useEffect(() => {
    input.current?.focus();
  }, []);
  function run(command: Command) {
    onClose();
    command.run();
  }
  return (
    <Modal title="O que você quer fazer?" onClose={onClose}>
      <div className="command-search">
        <Search size={17} />
        <input
          ref={input}
          aria-label="Buscar comando"
          placeholder="Uma ação ou um destino…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIndex(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setIndex((i) => Math.min(matches.length - 1, i + 1));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setIndex((i) => Math.max(0, i - 1));
            }
            if (e.key === "Enter" && matches[index]) {
              e.preventDefault();
              run(matches[index]);
            }
          }}
          aria-controls="command-list"
          aria-activedescendant={
            matches[index] ? `command-${matches[index].id}` : undefined
          }
          role="combobox"
          aria-expanded="true"
          aria-autocomplete="list"
        />
      </div>
      <div
        className="commands"
        id="command-list"
        role="listbox"
        aria-label="Comandos"
      >
        {matches.map((c, i) => (
          <button
            role="option"
            id={`command-${c.id}`}
            aria-selected={i === index}
            key={c.id}
            className={i === index ? "selected" : ""}
            onMouseEnter={() => setIndex(i)}
            onClick={() => run(c)}
          >
            <span>{c.label}</span>
            {c.hint ? <kbd>{c.hint}</kbd> : <ArrowUpRight size={14} />}
          </button>
        ))}
        {!matches.length && (
          <p className="empty-inline">Nenhuma ação encontrada.</p>
        )}
      </div>
      <div className="command-footer">
        <span>↑ ↓ para navegar</span>
        <span>↵ para escolher · Esc para fechar</span>
      </div>
    </Modal>
  );
}
