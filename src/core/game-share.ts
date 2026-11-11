import type { Game } from "./games";

// What a game's share text says: which puzzle (a number or a day, as the game labels it; GeoGuessr names none),
// the score to show, and the details worth sharing beside it, such as round scores or the emoji row.
export type ParsedShare = { puzzle: string | null; score: string; highlights: string[] };

type Parser = { name: string; expected: string; parse: (text: string) => ParsedShare | null };

const POINTS = String.raw`\d{1,3}(?:,\d{3})*`;
const KRILLION = /^Krillion #(\d+)\b.*\n(\d+)\s*(\n|$)/u;
const CHAINLE = new RegExp(String.raw`^Chainle #(\d+) · (${POINTS})(\s|$)`, "u");
const CHAINLE_BEAT = /^Beat (\d+)% of players$/u;
const GEOGUESSR_ROUND = new RegExp(String.raw`^\d+\. ([^:\n]+): (${POINTS}) pts\b`, "u");
const GEOGUESSR_TOTAL = new RegExp(String.raw`^Total: (${POINTS}) pts\b`, "u");
const FARFLUNG = new RegExp(String.raw`^Farflung #(\d+) · (${POINTS}\/${POINTS} km)\**(?: · ⌕)?\s*(\n|$)`, "u");
const FARFLUNG_PINS = /^(?:Miss|Common|Well known|Uncommon|Rare|Elusive|Farflung)(?: · (?:Miss|Common|Well known|Uncommon|Rare|Elusive|Farflung))*$/u;
const FARFLUNG_FURTHER = /^Further than (\d+)% of /u;
const WORDLE = new RegExp(String.raw`^Wordle (${POINTS}) ([1-6X]\/6)(\*?)\s*(\n|$)`, "u");
const EMOJI_ROW = /^[\p{Extended_Pictographic}️‍]+$/u;
const MAGNITUDLE_ROUND = /^[\p{Extended_Pictographic}️]+ (\d+)$/u;

const linesOf = (text: string) => text.split("\n").map((line) => line.trim());

const emojiRows = (text: string) => linesOf(text).filter((line) => EMOJI_ROW.test(line));

// Each Magnitudle mode titles its share "Magnitudle — <mode>", then the day (the Daily Question adds its season and
// question after it), then the total, then a row per round. A single round is the score itself, so it is no highlight.
const magnitudle = (name: string, title: string): Parser => {
  const pattern = new RegExp(String.raw`^${title}\s*\n(\d{4}-\d{2}-\d{2})(?: · [^\n]*)?\s*\n\s*Score: (\d+\/\d+)\s*(\n|$)`, "u");
  return {
    name,
    expected: `"${title}", a YYYY-MM-DD line, then "Score: <points>/<total>"`,
    parse: (text) => {
      const match = text.match(pattern);
      if (!match) return null;
      const rounds = linesOf(text).flatMap((line) => line.match(MAGNITUDLE_ROUND)?.[1] ?? []);
      return { puzzle: match[1], score: match[2], highlights: rounds.length > 1 ? rounds : [] };
    },
  };
};

const toNumber = (points: string) => Number(points.replaceAll(",", ""));

const parseGeoGuessr = (text: string): ParsedShare | null => {
  const lines = linesOf(text);
  const total = lines.at(-1)?.match(GEOGUESSR_TOTAL);
  const rounds = lines.slice(0, -1).map((line) => line.match(GEOGUESSR_ROUND));
  if (!total || rounds.length === 0 || rounds.some((round) => !round)) return null;
  const best = (rounds as RegExpMatchArray[]).reduce((top, round) => (toNumber(round[2]) > toNumber(top[2]) ? round : top));
  return { puzzle: null, score: `${total[1]} pts`, highlights: [`best: ${best[1]} ${best[2]}`] };
};

const parseChainle = (text: string): ParsedShare | null => {
  const match = text.match(CHAINLE);
  if (!match) return null;
  const beat = linesOf(text).flatMap((line) => line.match(CHAINLE_BEAT)?.[1] ?? []);
  return { puzzle: `#${match[1]}`, score: match[2], highlights: [...beat.map((percent) => `beat ${percent}%`), ...emojiRows(text)] };
};

// The line under the distance is the row of pins, or a sentence such as how many players you went further than.
const parseFarflung = (text: string): ParsedShare | null => {
  const match = text.match(FARFLUNG);
  if (!match) return null;
  const highlights = linesOf(text).slice(1).flatMap((line) => {
    if (FARFLUNG_PINS.test(line)) return [line];
    const further = line.match(FARFLUNG_FURTHER);
    return further ? [`further than ${further[1]}%`] : [];
  });
  return { puzzle: `#${match[1]}`, score: match[2], highlights };
};

const parseWordle = (text: string): ParsedShare | null => {
  const match = text.match(WORDLE);
  return match ? { puzzle: `#${match[1]}`, score: match[2], highlights: match[3] ? ["hard mode"] : [] } : null;
};

const parsers: Record<Game, Parser> = {
  "magnitudle-daily": magnitudle("Magnitudle Daily Question", "Magnitudle — Daily Question"),
  magnitudle: magnitudle("Magnitudle", "Magnitudle — Size It Up"),
  "magnitudle-geography": magnitudle("Magnitudle Geography", "Magnitudle — Size It Up: Geography"),
  krillion: {
    name: "Krillion",
    expected: '"Krillion #<number>" then the score on the next line',
    parse: (text) => {
      const match = text.match(KRILLION);
      return match ? { puzzle: `#${match[1]}`, score: match[2], highlights: emojiRows(text) } : null;
    },
  },
  chainle: { name: "Chainle", expected: '"Chainle #<number> · <points>"', parse: parseChainle },
  geoguessr: {
    name: "GeoGuessr",
    expected: 'numbered rounds ("1. <place>: <points> pts, …") then "Total: <points> pts"',
    parse: parseGeoGuessr,
  },
  farflung: { name: "Farflung", expected: '"Farflung #<number> · <km>/<km> km"', parse: parseFarflung },
  wordle: { name: "Wordle", expected: '"Wordle <number> <guesses>/6"', parse: parseWordle },
};

export const gameName = (game: Game): string => parsers[game].name;

export const parseShare = (game: Game, text: string): ParsedShare => {
  const parser = parsers[game];
  const parsed = parser.parse(text.trim());
  if (!parsed) throw new Error(`Not a ${parser.name} share: expected ${parser.expected}`);
  return parsed;
};
