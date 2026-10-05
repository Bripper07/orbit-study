import { useState, useRef } from "react";
import { Download, Upload, HardDrive } from "lucide-react";
import { Modal } from "./Modal";
import type { AppData } from "../types";
import { migrateData } from "../storage/repository";
import { routeStart } from "../domain/timeline";
import { actualFocusSeconds } from "../domain/focus";
export function SettingsPanel({
  data,
  onSave,
  onReplace,
  onClose,
}: {
  data: AppData;
  onSave: (data: AppData) => void;
  onReplace: (data: AppData) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(data.settings.name);
  const [time, setTime] = useState(data.settings.startTime);
  const [minutes, setMinutes] = useState(data.dailyMinutes);
  const [pause, setPause] = useState(data.settings.breakMinutes);
  const [imported, setImported] = useState<AppData | null>(null);
  const [error, setError] = useState("");
  const file = useRef<HTMLInputElement>(null);
  function exportBackup() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            ...data,
            focus: data.focus
              ? {
                  ...data.focus,
                  elapsedSeconds: actualFocusSeconds(data.focus),
                  runningSince: null,
                }
              : null,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orbit-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <Modal title="Seu espaço, seu ritmo" onClose={onClose}>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          onSave({
            ...data,
            dailyMinutes: minutes,
            settings: {
              name: name.trim(),
              startTime: time,
              breakMinutes: pause,
            },
            routeStartAt: routeStart(time),
          });
          onClose();
        }}
      >
        <label>
          Como podemos te chamar?
          <input
            required
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <div className="form-grid">
          <label>
            Início da rota
            <input
              required
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </label>
          <label>
            Tempo disponível (min)
            <input
              required
              type="number"
              min={10}
              max={1440}
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
            />
          </label>
        </div>
        <label>
          Pausa entre tarefas (min)
          <input
            required
            type="number"
            min={0}
            max={30}
            value={pause}
            onChange={(e) => setPause(Number(e.target.value))}
          />
        </label>
        <button className="button primary">Salvar meu ritmo</button>
      </form>
      <div className="settings-storage">
        <h3>
          <HardDrive size={16} />
          Memória local
        </h3>
        <p>
          {data.memory.sessions.length} sessões · {data.memory.events.length}{" "}
          registros. Sem nuvem e sem IA.
        </p>
        <div className="backup-actions">
          <button className="button small" onClick={exportBackup}>
            <Download size={14} />
            Exportar dados
          </button>
          <button
            className="button small"
            onClick={() => file.current?.click()}
          >
            <Upload size={14} />
            Importar cópia
          </button>
        </div>
        <input
          hidden
          ref={file}
          type="file"
          accept=".json,application/json"
          onChange={async (e) => {
            const selected = e.target.files?.[0];
            if (!selected) return;
            try {
              if (selected.size > 10 * 1024 * 1024) throw new Error();
              const value = migrateData(JSON.parse(await selected.text()));
              setImported({
                ...value,
                focus: value.focus
                  ? { ...value.focus, runningSince: null }
                  : null,
              });
              setError("");
            } catch {
              setError(
                "Essa cópia não contém dados válidos do Orbit. Seus dados atuais foram mantidos.",
              );
            }
            e.target.value = "";
          }}
        />
        {error && (
          <p role="alert" className="import-error">
            {error}
          </p>
        )}
        {imported && (
          <div className="import-preview">
            <p>
              A cópia contém {imported.tasks.length} tarefas e{" "}
              {imported.memory.sessions.length} sessões. Importar substitui os
              dados deste dispositivo.
            </p>
            <div className="modal-actions">
              <button
                className="button small"
                onClick={() => setImported(null)}
              >
                Cancelar
              </button>
              <button
                className="button small primary"
                onClick={() => {
                  onReplace(imported);
                  onClose();
                }}
              >
                Substituir pelos dados da cópia
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
