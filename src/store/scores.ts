import { parseShare } from "../core/game-share";
import { type Game, GAMES, type GameScore } from "../core/games";

// Every result ever pasted lives under this one key, as a JSON list sorted by day. Nothing is ever trimmed.
export const STORAGE_KEY = "daily-games/scores/v1";

type KeyValueStorage = Pick<Storage, "getItem" | "setItem">;

const DATE = /^\d{4}-\d{2}-\d{2}$/u;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

// A JSON list (this app's export) or one JSON object per line (JSON Lines).
const readEntries = (text: string): unknown[] => {
  const trimmed = text.trim();
  try {
    if (trimmed.startsWith("[")) return JSON.parse(trimmed) as unknown[];
    return trimmed.split("\n").filter((line) => line.trim()).map((line) => JSON.parse(line) as unknown);
  } catch {
    throw new Error("Not a scores file: expected a JSON list or one JSON object per line");
  }
};

// The score is always read again from the share text, so a file can never carry a score its share does not say.
const toScore = (entry: unknown, position: number): GameScore => {
  if (!isRecord(entry)) throw new Error(`entry ${position} is not an object`);
  const { date, game, share } = entry;
  if (typeof game !== "string" || !(GAMES as readonly string[]).includes(game)) throw new Error(`entry ${position} names an unknown game ${JSON.stringify(game)}`);
  if (typeof date !== "string" || !DATE.test(date)) throw new Error(`entry ${position} has the date ${JSON.stringify(date)}, not YYYY-MM-DD`);
  if (typeof share !== "string") throw new Error(`entry ${position} has no share text`);
  try {
    return { date, game: game as Game, score: parseShare(game as Game, share).score, share: share.trim() };
  } catch (error) {
    throw new Error(`entry ${position}: ${(error as Error).message}`);
  }
};

export const parseScores = (text: string): GameScore[] => readEntries(text).map((entry, index) => toScore(entry, index + 1));

const sameResult = (left: GameScore, right: GameScore) => left.date === right.date && left.game === right.game;

const byDay = (left: GameScore, right: GameScore) =>
  left.date.localeCompare(right.date) || GAMES.indexOf(left.game) - GAMES.indexOf(right.game);

// One result per game per day: a newer one takes the older one's place.
const merge = (current: GameScore[], incoming: GameScore[]): GameScore[] =>
  incoming.reduce((scores, entry) => [...scores.filter((score) => !sameResult(score, entry)), entry], current).sort(byDay);

export const createScoreStore = (storage: KeyValueStorage) => {
  const all = (): GameScore[] => {
    const saved = storage.getItem(STORAGE_KEY);
    if (saved === null) return [];
    try {
      return parseScores(saved);
    } catch (error) {
      throw new Error(`Saved scores are unreadable: ${(error as Error).message}`);
    }
  };

  const write = (scores: GameScore[]): GameScore[] => {
    storage.setItem(STORAGE_KEY, JSON.stringify(scores));
    return scores;
  };

  const save = ({ date, game, share }: { date: string; game: Game; share: string }): GameScore[] => {
    const text = share.trim();
    return write(merge(all(), [{ date, game, score: parseShare(game, text).score, share: text }]));
  };

  const importScores = (text: string): { added: number; replaced: number } => {
    const current = all();
    const incoming = merge([], parseScores(text));
    const replaced = incoming.filter((entry) => current.some((score) => sameResult(score, entry))).length;
    write(merge(current, incoming));
    return { added: incoming.length - replaced, replaced };
  };

  const exportText = (): string => JSON.stringify(all(), null, 2);

  return { all, save, importScores, exportText };
};

export type ScoreStore = ReturnType<typeof createScoreStore>;
