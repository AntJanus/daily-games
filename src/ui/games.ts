import { gameName, parseShare } from "../core/game-share";
import { type Game, GAMES, type GameScore } from "../core/games";

const LINKS: Record<Game, string> = {
  "magnitudle-daily": "https://magnitudle.com/daily",
  magnitudle: "https://magnitudle.com/size-it-up",
  "magnitudle-geography": "https://magnitudle.com/size-it-up/geography",
  krillion: "https://krillion.io",
  chainle: "https://chainle.io",
  geoguessr: "https://www.geoguessr.com",
  farflung: "https://farflung.game",
  factmap: "https://www.factmap.world",
  wordle: "https://www.nytimes.com/games/wordle",
};

// GeoGuessr's share lists rounds without saying which game they came from.
const NAMES_ITSELF: Record<Game, boolean> = {
  "magnitudle-daily": true, magnitudle: true, "magnitudle-geography": true, krillion: true, chainle: true, geoguessr: false,
  farflung: true, factmap: true, wordle: true,
};

// Each site's apple-touch icon, saved in public/games so the page never calls the sites to draw them.
const ICONS: Record<Game, string> = {
  "magnitudle-daily": "games/magnitudle.png",
  magnitudle: "games/magnitudle.png",
  "magnitudle-geography": "games/magnitudle.png",
  krillion: "games/krillion.png",
  chainle: "games/chainle.png",
  geoguessr: "games/geoguessr.png",
  farflung: "games/farflung.png",
  factmap: "games/factmap.png",
  wordle: "games/wordle.png",
};

// A card's title and subtitle: the Magnitudle modes share a title and differ by mode; the other games show their
// puzzle number. A puzzle named by date says nothing the tile's own date does not.
const MODES: Partial<Record<Game, { title: string; mode: string }>> = {
  "magnitudle-daily": { title: "Magnitudle", mode: "Daily Question" },
  magnitudle: { title: "Magnitudle", mode: "Size It Up" },
  "magnitudle-geography": { title: "Magnitudle", mode: "Geography" },
};

export type GameRow = {
  game: Game; name: string; href: string; icon: string; title: string; subtitle: string | null;
  score: string | null; puzzle: string | null; highlights: string[];
};

// One day's scores in, one row per game out, in the order of GAMES.
export const buildGameRows = (scores: GameScore[]): GameRow[] => GAMES.map((game) => {
  const entry = scores.find((score) => score.game === game);
  const parsed = entry ? parseShare(game, entry.share) : null;
  const mode = MODES[game];
  const puzzle = parsed?.puzzle ?? null;
  return {
    game, name: gameName(game), href: LINKS[game], icon: ICONS[game],
    title: mode?.title ?? gameName(game), subtitle: mode?.mode ?? (puzzle?.startsWith("#") ? puzzle : null),
    score: entry?.score ?? null, puzzle, highlights: parsed?.highlights ?? [],
  };
});

export const dayLabel = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

export const dailyScoresText = (date: string, scores: GameScore[]): string => {
  const shares = GAMES.flatMap((game) => {
    const entry = scores.find((score) => score.game === game);
    if (!entry) return [];
    return [NAMES_ITSELF[game] ? entry.share : `${gameName(game)}\n${entry.share}`];
  });
  return shares.length ? [`Daily games · ${dayLabel(date)}`, ...shares].join("\n\n") : "";
};

const escapeHtml = (text: string) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

// The condensed version for Slack: one line per game, its score and highlights. Slack's message box reads pasted
// text as Markdown, where *name* is italic, so the text bolds with **name**; the HTML is the same lines for a rich paste.
export const slackScores = (date: string, scores: GameScore[]): { text: string; html: string } => {
  const lines = GAMES.flatMap((game) => {
    const entry = scores.find((score) => score.game === game);
    if (!entry) return [];
    return [{ name: gameName(game), details: [entry.score, ...parseShare(game, entry.share).highlights].join(" · ") }];
  });
  if (!lines.length) return { text: "", html: "" };
  const title = `Daily games · ${dayLabel(date)}`;
  return {
    text: [`**${title}**`, ...lines.map((line) => `**${line.name}** ${line.details}`)].join("\n"),
    html: [`<b>${escapeHtml(title)}</b>`, ...lines.map((line) => `<b>${escapeHtml(line.name)}</b> ${escapeHtml(line.details)}`)].join("<br>"),
  };
};

export const localDate = (now: Date): string =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
