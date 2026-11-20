import { type ClipboardEvent, useState } from "react";
import type { Game, GameScore } from "../core/games";
import { buildGameRows, dailyScoresText, dayLabel, type GameRow, slackScores } from "../ui/games";
import { gameHref } from "../ui/route";
import { CopyButton, useToast } from "./toast";

type CardProps = { row: GameRow; onSave: (game: Game, share: string) => string | null };

function PasteBox({ row, onSave, onCancel }: CardProps & { onCancel?: () => void }) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const save = (share: string) => {
    const failure = onSave(row.game, share);
    setError(failure);
    if (!failure) setText("");
  };

  // Pasting saves at once; typed or edited text waits for Save.
  const onPaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = event.clipboardData.getData("text");
    if (!pasted.trim()) return;
    event.preventDefault();
    setText(pasted);
    save(pasted);
  };

  return (
    <div className="ov-game-paste">
      <textarea
        rows={2} value={text} placeholder="Paste your result" aria-label={`${row.name} share text`}
        onChange={(event) => setText(event.target.value)} onPaste={onPaste}
      />
      {(text.trim() || onCancel) && (
        <div className="ov-game-actions">
          {text.trim() && <button type="button" className="btn" onClick={() => save(text)}>Save</button>}
          {onCancel && <button type="button" className="btn" onClick={onCancel}>Cancel</button>}
        </div>
      )}
      {error && <p className="ov-game-error" role="alert">{error}</p>}
    </div>
  );
}

function GameCard({ row, onSave }: CardProps) {
  const [replacing, setReplacing] = useState(false);
  const played = row.score !== null;
  const save = (game: Game, share: string) => {
    const failure = onSave(game, share);
    if (!failure) setReplacing(false);
    return failure;
  };

  return (
    <li className="ov-game" data-played={played}>
      <div className="ov-game-head">
        <a className="ov-game-link" href={row.href} target="_blank" rel="noreferrer" title={`Open ${row.name} in a new tab`}>
          <img className="ov-game-icon" src={row.icon} alt="" width={36} height={36} />
          <div className="ov-game-title">
            <b>{row.title}</b>
            {row.subtitle && <span>{row.subtitle}</span>}
          </div>
        </a>
        {played && <span className="ov-game-check" aria-label="Played">✓</span>}
      </div>
      {played && !replacing && (
        <>
          <div className="ov-game-score num">{row.score}</div>
          <ul className="ov-game-details">{row.highlights.map((highlight, index) => <li key={index}>{highlight}</li>)}</ul>
        </>
      )}
      {!played && <div className="ov-game-score ov-game-unplayed">Not played yet</div>}
      {(!played || replacing) && <PasteBox row={row} onSave={save} onCancel={replacing ? () => setReplacing(false) : undefined} />}
      <div className="ov-game-foot">
        <a href={row.href} target="_blank" rel="noreferrer">Play ↗</a>
        <a href={gameHref(row.game)}>History</a>
        {played && !replacing && <button type="button" onClick={() => setReplacing(true)}>Replace</button>}
      </div>
    </li>
  );
}

// Puts both versions on the clipboard: Slack's message box takes the HTML and keeps the names bold; plain-text
// targets get Markdown bold.
function SlackCopyButton({ text, html }: { text: string; html: string }) {
  const notify = useToast();
  const [label, setLabel] = useState("Copy for Slack");
  const copy = async () => {
    try {
      await navigator.clipboard.write([new ClipboardItem({
        "text/plain": new Blob([text], { type: "text/plain" }),
        "text/html": new Blob([html], { type: "text/html" }),
      })]);
      setLabel("Copied");
      notify("Copied today's scores for Slack");
    } catch (error) {
      setLabel("Copy failed");
      notify(`Copy failed: ${(error as Error).message}`);
    }
    setTimeout(() => setLabel("Copy for Slack"), 1500);
  };
  return <button type="button" className="btn btn-lg btn-primary" onClick={copy}>{label}</button>;
}

export function GamesTile({ date, scores, onSave }: { date: string; scores: GameScore[]; onSave: CardProps["onSave"] }) {
  const rows = buildGameRows(scores);
  const played = rows.filter((row) => row.score !== null).length;
  const copyText = dailyScoresText(date, scores);
  const slack = slackScores(date, scores);
  return (
    <section className="ov-tile ov-games">
      <div className="ov-games-head">
        <h2>DAILY GAMES</h2>
        <span className="ov-games-date">{dayLabel(date)}</span>
        <span className="ov-games-progress">
          <span className="ov-games-dots" aria-hidden="true">{rows.map((row) => <i key={row.game} data-played={row.score !== null} />)}</span>
          {played === rows.length ? "All played today" : `${played} of ${rows.length} played today`}
        </span>
        {copyText && (
          <div className="ov-game-copy">
            <SlackCopyButton text={slack.text} html={slack.html} />
            <CopyButton text={copyText} name="full results" className="btn-lg" />
          </div>
        )}
      </div>
      <ul className="ov-games-grid">{rows.map((row) => <GameCard key={row.game} row={row} onSave={onSave} />)}</ul>
    </section>
  );
}
