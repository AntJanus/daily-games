import { describe, expect, it } from "vitest";
import { formatValue, shareStats } from "./game-stats";

const MAGNITUDLE = "Size It Up\n#99\n\nScore: 236/500\n\n🟥🟥🟥⬜⬜ 54\n🟥🟥⬜⬜⬜ 37\n🟥🟥🟥⬜⬜ 56\n⬜⬜⬜⬜⬜ 0\n🟥🟥🟥🟥⬜ 89\n\nhttps://magnitudle.com/size-it-up";
const MAGNITUDLE_DAILY = "Daily Question\n#264\n\nScore: 99/100\n\n🟥🟥🟥🟥🟥 99\n\nhttps://magnitudle.com/daily";
const GEOGUESSR = "1. Sri Lanka: 4,997 pts, 889 yd, 1 min, 15 sec, 5 steps\n2. Poland: 3,686 pts, 283 miles, 12 sec, 0 steps\nTotal: 8,683 pts, 284 miles, 1 min, 27 sec, 5 steps";

describe("shareStats", () => {
  it("reads Magnitudle's points, the total they are out of, and each round", () => {
    expect(shareStats("magnitudle", MAGNITUDLE)).toEqual({ value: 236, max: 500, percentile: null, rounds: [54, 37, 56, 0, 89] });
  });

  it("has no rounds for a single-round Daily Question", () => {
    expect(shareStats("magnitudle-daily", MAGNITUDLE_DAILY)).toEqual({ value: 99, max: 100, percentile: null, rounds: [] });
  });

  it("reads Krillion's plain score", () => {
    expect(shareStats("krillion", "Krillion #112 🦐\n410\n\n🐟🦑🏮🦑🏮🐟🦑")).toEqual({ value: 410, max: null, percentile: null, rounds: [] });
  });

  it("reads Chainle's points past the thousands comma, and the share of players beaten", () => {
    expect(shareStats("chainle", "Chainle #77 · 3,096 🔗\nBeat 46% of players\n🟨🟧🟧🟧🟨\nhttps://chainle.io"))
      .toEqual({ value: 3096, max: null, percentile: 46, rounds: [] });
  });

  it("reads GeoGuessr's total", () => {
    expect(shareStats("geoguessr", GEOGUESSR)).toEqual({ value: 8683, max: null, percentile: null, rounds: [] });
  });

  it("reads Farflung's distance, the day's limit, and the share of players it went further than", () => {
    expect(shareStats("farflung", "Farflung #40 · 1,000/1,000 km* · ⌕\nFurther than 72% of today's players. Can you reach the edge too?\nhttps://farflung.game"))
      .toEqual({ value: 1000, max: 1000, percentile: 72, rounds: [] });
  });

  it("reads FactMap's total, its maximum and each round", () => {
    expect(shareStats("factmap", "FactMap · Nov 18, 2026 🌍\n\n🔴 219\n🟠 508\n🔴 184\n🟠 524\n🟠 356\n\n1,791 / 5,000 · Wanderer\nhttps://www.factmap.world/"))
      .toEqual({ value: 1791, max: 5000, percentile: null, rounds: [219, 508, 184, 524, 356] });
  });

  it("reads Wordle's guesses, and counts a failed puzzle as a seventh guess", () => {
    expect(shareStats("wordle", "Wordle 1,606 4/6*\n\n🟩🟩🟩🟩🟩")).toEqual({ value: 4, max: 6, percentile: null, rounds: [] });
    expect(shareStats("wordle", "Wordle 1,607 X/6\n\n⬜⬜⬜⬜⬜")).toEqual({ value: 7, max: 6, percentile: null, rounds: [] });
  });

  it("refuses another game's share", () => {
    expect(() => shareStats("wordle", "Krillion #112 🦐\n410")).toThrow("Not a Wordle share");
  });
});

describe("formatValue", () => {
  it("groups thousands", () => {
    expect(formatValue("geoguessr", 10356)).toBe("10,356");
  });

  it("writes a failed Wordle as X", () => {
    expect(formatValue("wordle", 7)).toBe("X");
    expect(formatValue("wordle", 4)).toBe("4");
  });
});
