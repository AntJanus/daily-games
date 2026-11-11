import { gameName, parseShare } from "../core/game-share";
import { formatValue, SCALES, shareStats, type ShareStats, WORDLE_MISS } from "../core/game-stats";
import type { Game, GameScore } from "../core/games";
import { buildGameRows, dayLabel } from "./games";

export type ChartPoint = { date: string; label: string; value: number; display: string };
export type Axis = { min: number; max: number; ticks: { value: number; label: string }[] };
export type Chart = { title: string; note: string; points: ChartPoint[]; axis: Axis };
export type StatTile = { label: string; value: string; caption?: string };
export type Breakdown = { title: string; max: number; bars: { label: string; value: number; display: string }[] };
export type HistoryDay = { date: string; label: string; score: string; highlights: string[]; share: string };

export type GameHistory = {
  game: Game; name: string; title: string; subtitle: string | null; href: string; icon: string;
  tiles: StatTile[]; trend: Chart; percentile: Chart | null; breakdown: Breakdown | null; days: HistoryDay[];
};

type Played = { entry: GameScore; stats: ShareStats };

const DAY = 86_400_000;
const dayNumber = (date: string) => Date.parse(`${date}T00:00:00Z`) / DAY;

const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

const days = (count: number) => `${count} ${count === 1 ? "day" : "days"}`;

// Runs of consecutive days, oldest first.
const runs = (dates: string[]): { length: number; last: number }[] =>
  dates.map(dayNumber).reduce<{ length: number; last: number }[]>((found, day) => {
    const run = found.at(-1);
    if (run && day === run.last + 1) return [...found.slice(0, -1), { length: run.length + 1, last: day }];
    return [...found, { length: 1, last: day }];
  }, []);

// A streak still counts while today is unplayed: it ends only once a whole day was missed.
const currentStreak = (dates: string[], today: string): number => {
  const latest = runs(dates).at(-1);
  return latest && dayNumber(today) - latest.last <= 1 ? latest.length : 0;
};

// The step sizes people read easily: 1, 2 or 5 times a power of ten.
const niceStep = (rough: number): number => {
  const power = 10 ** Math.floor(Math.log10(rough));
  return [1, 2, 5, 10].map((factor) => factor * power).find((step) => step >= rough)!;
};

const tickLabel = (value: number, axisMax: number) => (axisMax >= 10_000 ? `${value / 1000}K` : value.toLocaleString("en-US"));

const ticksEvery = (step: number, max: number) =>
  Array.from({ length: Math.round(max / step) + 1 }, (_, index) => ({ value: index * step, label: tickLabel(index * step, max) }));

const scoreAxis = (game: Game, played: Played[]): Axis => {
  if (game === "wordle") {
    return { min: 1, max: WORDLE_MISS, ticks: [1, 2, 3, 4, 5, 6, WORDLE_MISS].map((value) => ({ value, label: formatValue(game, value) })) };
  }
  const total = Math.max(0, ...played.map(({ stats }) => stats.max ?? 0));
  if (total > 0) return { min: 0, max: total, ticks: ticksEvery(total / 5, total) };
  const best = Math.max(1, ...played.map(({ stats }) => stats.value));
  const step = niceStep(best / 4);
  const max = Math.ceil(best / step) * step;
  return { min: 0, max, ticks: ticksEvery(step, max) };
};

const trendNote = (game: Game, played: Played[]): string => {
  if (game === "wordle") return "guesses · fewer is better · X is a miss";
  const { unit } = SCALES[game];
  const totals = [...new Set(played.flatMap(({ stats }) => stats.max ?? []))];
  return `${totals.length === 1 ? `${unit} out of ${totals[0].toLocaleString("en-US")}` : unit} · higher is better`;
};

const point = (game: Game, { entry, stats }: Played): ChartPoint =>
  ({ date: entry.date, label: dayLabel(entry.date), value: stats.value, display: formatValue(game, stats.value) });

const tiles = (game: Game, played: Played[], today: string): StatTile[] => {
  const dates = played.map(({ entry }) => entry.date);
  const counts: StatTile[] = [
    { label: "Days played", value: String(played.length) },
    { label: "Current streak", value: days(currentStreak(dates, today)) },
    { label: "Longest streak", value: days(Math.max(0, ...runs(dates).map((run) => run.length))) },
  ];
  if (!played.length) return counts;
  const values = played.map(({ stats }) => stats.value);
  const lowerIsBetter = SCALES[game].better === "lower";
  const bestValue = lowerIsBetter ? Math.min(...values) : Math.max(...values);
  const bestDay = played.find(({ stats }) => stats.value === bestValue)!;
  const mean = average(values);
  return [
    ...counts,
    game === "wordle"
      ? { label: "Average", value: mean.toFixed(1), caption: "guesses, a miss counting as 7" }
      : { label: "Average", value: Math.round(mean).toLocaleString("en-US"), caption: SCALES[game].unit },
    { label: "Best", value: formatValue(game, bestValue), caption: dayLabel(bestDay.entry.date) },
  ];
};

const breakdown = (game: Game, played: Played[]): Breakdown | null => {
  if (!played.length) return null;
  if (game === "wordle") {
    const bars = [1, 2, 3, 4, 5, 6, WORDLE_MISS].map((guesses) => {
      const count = played.filter(({ stats }) => stats.value === guesses).length;
      return { label: formatValue(game, guesses), value: count, display: String(count) };
    });
    return { title: "Guess distribution", max: Math.max(...bars.map((bar) => bar.value)), bars };
  }
  const withRounds = played.filter(({ stats }) => stats.rounds.length > 1);
  if (!withRounds.length) return null;
  const roundCount = Math.max(...withRounds.map(({ stats }) => stats.rounds.length));
  const bars = Array.from({ length: roundCount }, (_, index) => {
    const mean = average(withRounds.flatMap(({ stats }) => stats.rounds[index] ?? []));
    return { label: `Round ${index + 1}`, value: mean, display: String(Math.round(mean)) };
  });
  const total = Math.max(...withRounds.map(({ stats }) => stats.max ?? 0));
  return { title: "Average by round", max: total > 0 ? total / roundCount : Math.max(...bars.map((bar) => bar.value)), bars };
};

const percentile = (played: Played[]): Chart | null => {
  const points = played.flatMap(({ entry, stats }) =>
    stats.percentile === null ? [] : [{ date: entry.date, label: dayLabel(entry.date), value: stats.percentile, display: `${stats.percentile}%` }]);
  if (!points.length) return null;
  return {
    title: "Players beaten", note: "percent of the day's players · higher is better", points,
    axis: { min: 0, max: 100, ticks: [0, 25, 50, 75, 100].map((value) => ({ value, label: `${value}%` })) },
  };
};

// Everything one game's page shows, from every saved score. today decides whether a streak is still running.
export const buildGameHistory = (game: Game, scores: GameScore[], today: string): GameHistory => {
  const played = scores
    .filter((entry) => entry.game === game)
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((entry) => ({ entry, stats: shareStats(game, entry.share) }));
  const card = buildGameRows([]).find((row) => row.game === game)!;
  return {
    game, name: gameName(game), title: card.title, subtitle: card.subtitle, href: card.href, icon: card.icon,
    tiles: tiles(game, played, today),
    trend: { title: "Score by day", note: trendNote(game, played), points: played.map((entry) => point(game, entry)), axis: scoreAxis(game, played) },
    percentile: percentile(played),
    breakdown: breakdown(game, played),
    days: played.toReversed().map(({ entry }) => ({
      date: entry.date, label: dayLabel(entry.date), score: entry.score, highlights: parseShare(game, entry.share).highlights, share: entry.share,
    })),
  };
};
