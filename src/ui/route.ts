import { type Game, GAMES } from "../core/games";

// The app lives at one URL on GitHub Pages, so pages are hash routes: "#/" is today, "#/game/<game>" a game's history.
export type Route = { page: "today" } | { page: "game"; game: Game } | { page: "unknown"; hash: string };

export const parseRoute = (hash: string): Route => {
  const path = hash.replace(/^#/u, "");
  if (path === "" || path === "/") return { page: "today" };
  const game = path.match(/^\/game\/([a-z-]+)$/u)?.[1];
  if (game && (GAMES as readonly string[]).includes(game)) return { page: "game", game: game as Game };
  return { page: "unknown", hash };
};

export const gameHref = (game: Game) => `#/game/${game}`;
