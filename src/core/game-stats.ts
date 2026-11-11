import { parseShare } from "./game-share";
import type { Game } from "./games";

// The numbers behind a share, for charts: the score as a number, the total it is out of when the game has one,
// the share of players beaten when the game says, and each round's points when a game has several.
export type ShareStats = { value: number; max: number | null; percentile: number | null; rounds: number[] };

export type Scale = { unit: string; better: "higher" | "lower" };

export const SCALES: Record<Game, Scale> = {
  "magnitudle-daily": { unit: "points", better: "higher" },
  magnitudle: { unit: "points", better: "higher" },
  "magnitudle-geography": { unit: "points", better: "higher" },
  krillion: { unit: "points", better: "higher" },
  chainle: { unit: "points", better: "higher" },
  geoguessr: { unit: "points", better: "higher" },
  farflung: { unit: "km", better: "higher" },
  wordle: { unit: "guesses", better: "lower" },
};

// A missed Wordle sits one step past the sixth guess, so it plots and averages as the worst result.
export const WORDLE_MISS = 7;

const POINTS = String.raw`\d{1,3}(?:,\d{3})*`;
const SCORE = new RegExp(String.raw`^(X|${POINTS})(?:\/(${POINTS}))?(?: (?:pts|km))?$`, "u");
const PERCENT = /^(?:beat|further than) (\d+)%$/u;
const ROUND = /^\d+$/u;

const toNumber = (points: string) => Number(points.replaceAll(",", ""));

export const shareStats = (game: Game, share: string): ShareStats => {
  const { score, highlights } = parseShare(game, share);
  const match = score.match(SCORE);
  if (!match) throw new Error(`Cannot read a number from the ${game} score "${score}"`);
  const percent = highlights.flatMap((highlight) => highlight.match(PERCENT)?.[1] ?? []);
  return {
    value: match[1] === "X" ? WORDLE_MISS : toNumber(match[1]),
    max: match[2] ? toNumber(match[2]) : null,
    percentile: percent.length ? Number(percent[0]) : null,
    rounds: game.startsWith("magnitudle") ? highlights.filter((highlight) => ROUND.test(highlight)).map(Number) : [],
  };
};

export const formatValue = (game: Game, value: number): string =>
  game === "wordle" && value === WORDLE_MISS ? "X" : value.toLocaleString("en-US");
