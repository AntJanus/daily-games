import { useEffect, useMemo, useState } from "react";
import type { Game, GameScore } from "./core/games";
import { DataPanel } from "./components/DataPanel";
import { GamePage } from "./components/GamePage";
import { GamesTile } from "./components/GamesTile";
import { createScoreStore } from "./store/scores";
import { buildGameRows, localDate } from "./ui/games";
import { gameHref, parseRoute } from "./ui/route";

const useHash = () => {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash;
};

type Loaded = { scores: GameScore[]; error: string | null };

export function App() {
  const store = useMemo(() => createScoreStore(window.localStorage), []);
  const [{ scores, error }, setLoaded] = useState<Loaded>(() => {
    try {
      return { scores: store.all(), error: null };
    } catch (failure) {
      return { scores: [], error: (failure as Error).message };
    }
  });
  const route = parseRoute(useHash());
  const today = localDate(new Date());

  const onSave = (game: Game, share: string): string | null => {
    try {
      setLoaded({ scores: store.save({ date: today, game, share }), error: null });
      return null;
    } catch (failure) {
      return (failure as Error).message;
    }
  };

  const onImport = (text: string) => {
    const result = store.importScores(text);
    setLoaded({ scores: store.all(), error: null });
    return result;
  };

  return (
    <div className="page">
      <header className="top">
        <a className="brand" href="#/">Daily Games</a>
        <nav className="game-tabs" aria-label="Pages">
          <a href="#/" aria-current={route.page === "today" ? "page" : undefined}>Today</a>
          {buildGameRows([]).map((row) => (
            <a key={row.game} href={gameHref(row.game)} aria-current={route.page === "game" && route.game === row.game ? "page" : undefined}>
              {row.name}
            </a>
          ))}
        </nav>
      </header>
      {error && <p className="page-error" role="alert">{error}. Nothing was changed; export is unavailable until the saved data is fixed.</p>}
      {route.page === "unknown" && <p className="page-error" role="alert">No page at {route.hash}. <a href="#/">Go to today</a>.</p>}
      {route.page === "today" && !error && (
        <>
          <GamesTile date={today} scores={scores.filter((entry) => entry.date === today)} onSave={onSave} />
          <DataPanel scores={scores} exportText={store.exportText} onImport={onImport} today={today} />
        </>
      )}
      {route.page === "game" && !error && <GamePage game={route.game} scores={scores} today={today} />}
    </div>
  );
}
