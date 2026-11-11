import { describe, expect, it } from "vitest";
import { parseShare } from "./game-share";

// Real share text, pasted from each game's Share button.
const KRILLION = "Krillion #112 🦐\n410\n\n🐟🦑🏮🦑🏮🐟🦑";
const MAGNITUDLE = `Magnitudle — Size It Up
2026-11-04

Score: 301/500

🟥🟥🟥🟥⬜ 77
🟥🟥🟥⬜⬜ 60
🟥🟥🟥🟥⬜ 86
🟥⬜⬜⬜⬜ 16
🟥🟥🟥⬜⬜ 62

https://magnitudle.com/size-it-up`;
const MAGNITUDLE_GEOGRAPHY = `Magnitudle — Size It Up: Geography
2026-11-04

Score: 305/500

🟥🟥🟥🟥🟥 100
🟥🟥🟥🟥⬜ 79
🟥⬜⬜⬜⬜ 26
⬜⬜⬜⬜⬜ 0
🟥🟥🟥🟥🟥 100

https://magnitudle.com/size-it-up/geography`;
const GEOGUESSR = `1. Sri Lanka: 4,997 pts, 889 yd, 1 min, 15 sec, 5 steps
2. Ecuador: 387 pts, 2,373 miles, 2 min, 47 sec, 41 steps
3. Mexico: 635 pts, 1,913 miles, 2 min, 36 sec, 28 steps
4. Romania: 651 pts, 1,890 miles, 1 min, 11 sec, 7 steps
5. Poland: 3,686 pts, 283 miles, 12 sec, 0 steps
Total: 10,356 pts, 6,458 miles, 8 min, 1 sec, 81 steps`;
const CHAINLE = "Chainle #77 · 3,096 🔗\nBeat 46% of players\n🟨🟧🟧🟧🟨\nhttps://chainle.io";
// Built from each game's share code (farflung.game's camp-kit chunk, magnitudle.com's buildGameSharePayload), since
// no paste was at hand; Wordle's is its long-standing format. Replace them with real pastes when they come in.
const FARFLUNG = "Farflung #40 · 370/500 km\nCommon · Rare · Miss · Uncommon · Farflung\nhttps://farflung.game/s/k7m2qx?e=40";
const FARFLUNG_SENTENCE = "Farflung #40 · 1,000/1,000 km* · ⌕\nFurther than 72% of today's players. Can you reach the edge too?\nhttps://farflung.game";
const MAGNITUDLE_DAILY = `Magnitudle — Daily Question
2026-11-11 · S03 · Q12

Score: 87/100

🟥🟥🟥🟥⬜ 87

https://magnitudle.com/daily`;
const WORDLE = "Wordle 1,606 4/6*\n\n⬜🟨⬜⬜⬜\n⬜⬜🟩🟨⬜\n🟩🟩🟩⬜🟩\n🟩🟩🟩🟩🟩";

describe("parseShare: krillion", () => {
  it("reads the score from the line under the puzzle number", () => {
    expect(parseShare("krillion", KRILLION)).toEqual({ puzzle: "#112", score: "410", highlights: ["🐟🦑🏮🦑🏮🐟🦑"] });
  });

  it("has no highlight when the share has no emoji row", () => {
    expect(parseShare("krillion", "Krillion #112 🦐\n410")).toEqual({ puzzle: "#112", score: "410", highlights: [] });
  });

  it("ignores the whitespace a paste picks up around the text", () => {
    expect(parseShare("krillion", `\n  ${KRILLION}\n\n`)).toEqual({ puzzle: "#112", score: "410", highlights: ["🐟🦑🏮🦑🏮🐟🦑"] });
  });

  it("refuses text that is not a Krillion share", () => {
    expect(() => parseShare("krillion", "Chainle #12\n4/5")).toThrow('Not a Krillion share: expected "Krillion #<number>" then the score on the next line');
    expect(() => parseShare("krillion", "Krillion #112 🦐\nlots")).toThrow("Not a Krillion share");
  });
});

describe("parseShare: magnitudle", () => {
  it("reads the day and the score out of its total", () => {
    expect(parseShare("magnitudle", MAGNITUDLE)).toEqual({ puzzle: "2026-11-04", score: "301/500", highlights: ["77", "60", "86", "16", "62"] });
  });

  it("refuses text that is not a Magnitudle share", () => {
    expect(() => parseShare("magnitudle", KRILLION)).toThrow('Not a Magnitudle share: expected "Magnitudle — Size It Up", a YYYY-MM-DD line, then "Score: <points>/<total>"');
    expect(() => parseShare("magnitudle", MAGNITUDLE_GEOGRAPHY)).toThrow("Not a Magnitudle share");
    expect(() => parseShare("magnitudle", "Magnitudle — Size It Up\n2026-11-04\n\nScore: lots")).toThrow("Not a Magnitudle share");
  });
});

describe("parseShare: magnitudle-geography", () => {
  it("reads the day and the score out of its total", () => {
    expect(parseShare("magnitudle-geography", MAGNITUDLE_GEOGRAPHY)).toEqual({ puzzle: "2026-11-04", score: "305/500", highlights: ["100", "79", "26", "0", "100"] });
  });

  it("refuses the other Magnitudle mode", () => {
    expect(() => parseShare("magnitudle-geography", MAGNITUDLE)).toThrow('Not a Magnitudle Geography share: expected "Magnitudle — Size It Up: Geography", a YYYY-MM-DD line, then "Score: <points>/<total>"');
  });
});

describe("parseShare: chainle", () => {
  it("reads the puzzle number and the points beside it", () => {
    expect(parseShare("chainle", CHAINLE)).toEqual({ puzzle: "#77", score: "3,096", highlights: ["beat 46%", "🟨🟧🟧🟧🟨"] });
  });

  it("has no highlights when the share has only its first line", () => {
    expect(parseShare("chainle", "Chainle #77 · 3,096 🔗")).toEqual({ puzzle: "#77", score: "3,096", highlights: [] });
  });

  it("refuses text that is not a Chainle share", () => {
    expect(() => parseShare("chainle", KRILLION)).toThrow('Not a Chainle share: expected "Chainle #<number> · <points>"');
    expect(() => parseShare("chainle", "Chainle #77 · lots 🔗")).toThrow("Not a Chainle share");
  });
});

describe("parseShare: geoguessr", () => {
  it("reads the total points; the share names no puzzle", () => {
    expect(parseShare("geoguessr", GEOGUESSR)).toEqual({ puzzle: null, score: "10,356 pts", highlights: ["best: Sri Lanka 4,997"] });
  });

  it("refuses text that is not a GeoGuessr share", () => {
    expect(() => parseShare("geoguessr", CHAINLE)).toThrow('Not a GeoGuessr share: expected numbered rounds ("1. <place>: <points> pts, …") then "Total: <points> pts"');
    expect(() => parseShare("geoguessr", "Total: 10,356 pts")).toThrow("Not a GeoGuessr share");
  });
});

describe("parseShare: farflung", () => {
  it("reads the distance out of the reachable edge and the row of pins", () => {
    expect(parseShare("farflung", FARFLUNG)).toEqual({ puzzle: "#40", score: "370/500 km", highlights: ["Common · Rare · Miss · Uncommon · Farflung"] });
  });

  it("reads how many players you beat when the share says so instead of listing pins, past the settings marks", () => {
    expect(parseShare("farflung", FARFLUNG_SENTENCE)).toEqual({ puzzle: "#40", score: "1,000/1,000 km", highlights: ["further than 72%"] });
  });

  it("refuses text that is not a daily Farflung share", () => {
    expect(() => parseShare("farflung", WORDLE)).toThrow('Not a Farflung share: expected "Farflung #<number> · <km>/<km> km"');
    expect(() => parseShare("farflung", "Farflung ∞ · 370/500 km\nCan you get further?")).toThrow("Not a Farflung share");
    expect(() => parseShare("farflung", "Farflung · Expedition #40 replay · unranked\n370 km")).toThrow("Not a Farflung share");
  });
});

describe("parseShare: magnitudle-daily", () => {
  it("reads the day and the score; its one round is the score, so it has no highlights", () => {
    expect(parseShare("magnitudle-daily", MAGNITUDLE_DAILY)).toEqual({ puzzle: "2026-11-11", score: "87/100", highlights: [] });
  });

  it("refuses the Size It Up modes", () => {
    expect(() => parseShare("magnitudle-daily", MAGNITUDLE)).toThrow('Not a Magnitudle Daily Question share: expected "Magnitudle — Daily Question", a YYYY-MM-DD line, then "Score: <points>/<total>"');
    expect(() => parseShare("magnitudle", MAGNITUDLE_DAILY)).toThrow("Not a Magnitudle share");
  });
});

describe("parseShare: wordle", () => {
  it("reads the puzzle number and the guesses, and notes hard mode", () => {
    expect(parseShare("wordle", WORDLE)).toEqual({ puzzle: "#1,606", score: "4/6", highlights: ["hard mode"] });
  });

  it("reads a miss as X/6 with no hard mode", () => {
    expect(parseShare("wordle", "Wordle 1,606 X/6\n\n⬜🟨⬜⬜⬜")).toEqual({ puzzle: "#1,606", score: "X/6", highlights: [] });
  });

  it("refuses text that is not a Wordle share", () => {
    expect(() => parseShare("wordle", KRILLION)).toThrow('Not a Wordle share: expected "Wordle <number> <guesses>/6"');
    expect(() => parseShare("wordle", "Wordle 1,606 7/6")).toThrow("Not a Wordle share");
  });
});
