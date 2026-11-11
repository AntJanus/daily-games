import { type ChangeEvent, useRef } from "react";
import type { GameScore } from "../core/games";
import { useToast } from "./toast";

type Props = {
  scores: GameScore[]; today: string; exportText: () => string;
  onImport: (text: string) => { added: number; replaced: number };
};

const count = (total: number, noun: string) => `${total} ${noun}${total === 1 ? "" : "s"}`;

// Scores live only in this browser, so the file is the one way to back them up or move them to another device.
export function DataPanel({ scores, today, exportText, onImport }: Props) {
  const notify = useToast();
  const picker = useRef<HTMLInputElement>(null);
  const dayCount = new Set(scores.map((entry) => entry.date)).size;

  const download = () => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([exportText()], { type: "application/json" }));
    link.download = `daily-games-${today}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const importFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const { added, replaced } = onImport(await file.text());
      notify(`Imported ${count(added, "new result")}, replaced ${replaced}`);
    } catch (error) {
      notify(`Import failed: ${(error as Error).message}`);
    }
  };

  return (
    <section className="ov-tile data-panel">
      <p>
        {scores.length
          ? `${count(scores.length, "result")} across ${count(dayCount, "day")} saved in this browser, and nowhere else.`
          : "Results you paste are saved in this browser, and nowhere else."}
        {" "}Export a file to back them up or move them to another device.
      </p>
      <div className="data-actions">
        <button type="button" className="btn btn-lg" onClick={download} disabled={!scores.length}>Export</button>
        <button type="button" className="btn btn-lg" onClick={() => picker.current?.click()}>Import</button>
        <input ref={picker} type="file" accept=".json,.jsonl,.txt,application/json" aria-label="Import a scores file" tabIndex={-1} onChange={importFile} />
      </div>
    </section>
  );
}
