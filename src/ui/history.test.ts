import { describe, expect, it } from "vitest";
import type { GameScore } from "../core/games";
import { buildGameHistory } from "./history";

const magnitudle = (date: string, rounds: number[]): GameScore => {
  const total = rounds.reduce((sum, round) => sum + round, 0);
  const share = `Magnitudle — Size It Up\n${date}\n\nScore: ${total}/500\n\n${rounds.map((round) => `🟥⬜⬜⬜⬜ ${round}`).join("\n")}\n\nhttps://magnitudle.com/size-it-up`;
  return { date, game: "magnitudle", score: `${total}/500`, share };
};
const wordle = (date: string, guesses: string): GameScore =>
  ({ date, game: "wordle", score: `${guesses}/6`, share: `Wordle 1,606 ${guesses}/6\n\n🟩🟩🟩🟩🟩` });
const chainle = (date: string, points: string, beat: number): GameScore =>
  ({ date, game: "chainle", score: points, share: `Chainle #77 · ${points} 🔗\nBeat ${beat}% of players\n🟨🟧🟧🟧🟨\nhttps://chainle.io` });

const scores: GameScore[] = [
  magnitudle("2026-11-04", [77, 60, 86, 16, 62]),
  magnitudle("2026-11-05", [88, 68, 100, 73, 47]),
  magnitudle("2026-11-08", [50, 50, 50, 50, 50]),
  magnitudle("2026-11-10", [100, 100, 100, 100, 0]),
  magnitudle("2026-11-11", [80, 80, 80, 80, 80]),
  wordle("2026-11-10", "3"),
  wordle("2026-11-11", "X"),
  chainle("2026-11-04", "3,096", 46),
];

describe("buildGameHistory", () => {
  const history = buildGameHistory("magnitudle", scores, "2026-11-11");

  it("names the game as its card does", () => {
    expect(history).toMatchObject({
      game: "magnitudle", name: "Magnitudle", title: "Magnitudle", subtitle: "Size It Up",
      href: "https://magnitudle.com/size-it-up", icon: "games/magnitudle.png",
    });
  });

  it("plots only this game's days, oldest first", () => {
    expect(history.trend.points).toEqual([
      { date: "2026-11-04", label: "Wed, Nov 4", value: 301, display: "301" },
      { date: "2026-11-05", label: "Thu, Nov 5", value: 376, display: "376" },
      { date: "2026-11-08", label: "Sun, Nov 8", value: 250, display: "250" },
      { date: "2026-11-10", label: "Tue, Nov 10", value: 400, display: "400" },
      { date: "2026-11-11", label: "Wed, Nov 11", value: 400, display: "400" },
    ]);
  });

  it("scales a game scored out of a total from zero to that total", () => {
    expect(history.trend.axis).toEqual({
      min: 0, max: 500,
      ticks: [0, 100, 200, 300, 400, 500].map((value) => ({ value, label: String(value) })),
    });
    expect(history.trend.title).toBe("Score by day");
    expect(history.trend.note).toBe("points out of 500 · higher is better");
  });

  it("counts days played, the streak running through today, the longest streak, the average and the best day", () => {
    expect(history.tiles).toEqual([
      { label: "Days played", value: "5" },
      { label: "Current streak", value: "2 days" },
      { label: "Longest streak", value: "2 days" },
      { label: "Average", value: "345", caption: "points" },
      { label: "Best", value: "400", caption: "Tue, Nov 10" },
    ]);
  });

  it("keeps a streak alive when today is not played yet, and ends it after a missed day", () => {
    expect(buildGameHistory("magnitudle", scores, "2026-11-12").tiles[1]).toEqual({ label: "Current streak", value: "2 days" });
    expect(buildGameHistory("magnitudle", scores, "2026-11-13").tiles[1]).toEqual({ label: "Current streak", value: "0 days" });
    expect(buildGameHistory("chainle", scores, "2026-11-05").tiles[1]).toEqual({ label: "Current streak", value: "1 day" });
  });

  it("averages each Magnitudle round across days", () => {
    expect(history.breakdown).toEqual({
      title: "Average by round", max: 100,
      bars: [
        { label: "Round 1", value: 79, display: "79" },
        { label: "Round 2", value: 71.6, display: "72" },
        { label: "Round 3", value: 83.2, display: "83" },
        { label: "Round 4", value: 63.8, display: "64" },
        { label: "Round 5", value: 47.8, display: "48" },
      ],
    });
    expect(history.percentile).toBeNull();
  });

  it("lists every day newest first with its score, highlights and share text", () => {
    expect(history.days[0]).toEqual({
      date: "2026-11-11", label: "Wed, Nov 11", score: "400/500", highlights: ["80", "80", "80", "80", "80"], share: scores[4].share,
    });
    expect(history.days.map((day) => day.date)).toEqual(["2026-11-11", "2026-11-10", "2026-11-08", "2026-11-05", "2026-11-04"]);
  });

  it("scales Wordle from 1 guess to a fail, counts guesses, and treats fewer as better", () => {
    const wordleHistory = buildGameHistory("wordle", scores, "2026-11-11");
    expect(wordleHistory.trend.axis).toEqual({
      min: 1, max: 7,
      ticks: [{ value: 1, label: "1" }, { value: 2, label: "2" }, { value: 3, label: "3" }, { value: 4, label: "4" }, { value: 5, label: "5" }, { value: 6, label: "6" }, { value: 7, label: "X" }],
    });
    expect(wordleHistory.trend.note).toBe("guesses · fewer is better · X is a miss");
    expect(wordleHistory.trend.points.map((point) => point.display)).toEqual(["3", "X"]);
    expect(wordleHistory.tiles.slice(3)).toEqual([
      { label: "Average", value: "5.0", caption: "guesses, a miss counting as 7" },
      { label: "Best", value: "3", caption: "Tue, Nov 10" },
    ]);
    expect(wordleHistory.breakdown).toEqual({
      title: "Guess distribution", max: 1,
      bars: ["1", "2", "3", "4", "5", "6", "X"].map((label) => ({ label, value: label === "3" || label === "X" ? 1 : 0, display: label === "3" || label === "X" ? "1" : "0" })),
    });
  });

  it("scales a game with no total up to a round number above its best, and plots the players beaten", () => {
    const chainleHistory = buildGameHistory("chainle", scores, "2026-11-11");
    expect(chainleHistory.trend.axis).toEqual({
      min: 0, max: 4000,
      ticks: [0, 1000, 2000, 3000, 4000].map((value) => ({ value, label: value.toLocaleString("en-US") })),
    });
    expect(chainleHistory.breakdown).toBeNull();
    expect(chainleHistory.percentile).toEqual({
      title: "Players beaten", note: "percent of the day's players · higher is better",
      points: [{ date: "2026-11-04", label: "Wed, Nov 4", value: 46, display: "46%" }],
      axis: { min: 0, max: 100, ticks: [0, 25, 50, 75, 100].map((value) => ({ value, label: `${value}%` })) },
    });
  });

  it("is empty but whole for a game never played", () => {
    const empty = buildGameHistory("krillion", scores, "2026-11-11");
    expect(empty.days).toEqual([]);
    expect(empty.trend.points).toEqual([]);
    expect(empty.tiles).toEqual([
      { label: "Days played", value: "0" },
      { label: "Current streak", value: "0 days" },
      { label: "Longest streak", value: "0 days" },
    ]);
  });
});
