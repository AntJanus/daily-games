import { describe, expect, it } from "vitest";
import type { GameScore } from "../core/games";
import { buildGameRows, dailyScoresText, dayLabel, localDate, slackScores } from "./games";

const KRILLION = "Krillion #112 🦐\n410\n\n🐟🦑🏮🦑🏮🐟🦑";
const CHAINLE = "Chainle #77 · 3,096 🔗\nBeat 46% of players\n🟨🟧🟧🟧🟨\nhttps://chainle.io";
const FARFLUNG = "Farflung #40 · 370/500 km\nCommon · Rare · Miss\nhttps://farflung.game/s/k7m2qx?e=40";
const FACTMAP = "FactMap · Nov 18, 2026 🌍\n\n🔴 219\n🟠 508\n\n1,791 / 5,000 · Wanderer\nhttps://www.factmap.world/";
const GEOGUESSR = "1. Poland: 3,686 pts, 283 miles, 12 sec, 0 steps\nTotal: 3,686 pts, 283 miles, 12 sec, 0 steps";

const scores: GameScore[] = [
  { date: "2026-11-04", game: "geoguessr", score: "3,686 pts", share: GEOGUESSR },
  { date: "2026-11-04", game: "krillion", score: "410", share: KRILLION },
  { date: "2026-11-04", game: "chainle", score: "3,096", share: CHAINLE },
  { date: "2026-11-04", game: "farflung", score: "370/500 km", share: FARFLUNG },
  { date: "2026-11-04", game: "factmap", score: "1,791/5,000", share: FACTMAP },
];

describe("buildGameRows", () => {
  it("lists every game in order with its link, icon and card title, and the score, puzzle and highlights once pasted", () => {
    expect(buildGameRows(scores)).toEqual([
      { game: "magnitudle-daily", name: "Magnitudle Daily Question", href: "https://magnitudle.com/daily", icon: "games/magnitudle.png", title: "Magnitudle", subtitle: "Daily Question", score: null, puzzle: null, highlights: [] },
      { game: "magnitudle", name: "Magnitudle", href: "https://magnitudle.com/size-it-up", icon: "games/magnitudle.png", title: "Magnitudle", subtitle: "Size It Up", score: null, puzzle: null, highlights: [] },
      { game: "magnitudle-geography", name: "Magnitudle Geography", href: "https://magnitudle.com/size-it-up/geography", icon: "games/magnitudle.png", title: "Magnitudle", subtitle: "Geography", score: null, puzzle: null, highlights: [] },
      { game: "krillion", name: "Krillion", href: "https://krillion.io", icon: "games/krillion.png", title: "Krillion", subtitle: "#112", score: "410", puzzle: "#112", highlights: ["🐟🦑🏮🦑🏮🐟🦑"] },
      { game: "chainle", name: "Chainle", href: "https://chainle.io", icon: "games/chainle.png", title: "Chainle", subtitle: "#77", score: "3,096", puzzle: "#77", highlights: ["beat 46%", "🟨🟧🟧🟧🟨"] },
      { game: "geoguessr", name: "GeoGuessr", href: "https://www.geoguessr.com", icon: "games/geoguessr.png", title: "GeoGuessr", subtitle: null, score: "3,686 pts", puzzle: null, highlights: ["best: Poland 3,686"] },
      { game: "farflung", name: "Farflung", href: "https://farflung.game", icon: "games/farflung.png", title: "Farflung", subtitle: "#40", score: "370/500 km", puzzle: "#40", highlights: ["Common · Rare · Miss"] },
      { game: "factmap", name: "FactMap", href: "https://www.factmap.world", icon: "games/factmap.png", title: "FactMap", subtitle: null, score: "1,791/5,000", puzzle: "Nov 18, 2026", highlights: ["Wanderer", "219", "508"] },
      { game: "wordle", name: "Wordle", href: "https://www.nytimes.com/games/wordle", icon: "games/wordle.png", title: "Wordle", subtitle: null, score: null, puzzle: null, highlights: [] },
    ]);
  });
});

describe("dailyScoresText", () => {
  it("puts each pasted share under the day, in game order, naming GeoGuessr since its share does not", () => {
    expect(dailyScoresText("2026-11-04", scores)).toBe([
      "Daily games · Wed, Nov 4",
      "",
      KRILLION,
      "",
      CHAINLE,
      "",
      `GeoGuessr\n${GEOGUESSR}`,
      "",
      FARFLUNG,
      "",
      FACTMAP,
    ].join("\n"));
  });

  it("is empty when nothing is pasted", () => {
    expect(dailyScoresText("2026-11-04", [])).toBe("");
  });
});

describe("slackScores", () => {
  const magnitudle: GameScore = {
    date: "2026-11-04", game: "magnitudle", score: "301/500",
    share: "Magnitudle — Size It Up\n2026-11-04\n\nScore: 301/500\n\n🟥🟥🟥🟥⬜ 77\n🟥🟥🟥⬜⬜ 60\n\nhttps://magnitudle.com/size-it-up",
  };

  it("condenses each game to one line of score and highlights, names bold in Markdown, which Slack's message box reads; a single * would be italic", () => {
    expect(slackScores("2026-11-04", [...scores, magnitudle]).text).toBe([
      "**Daily games · Wed, Nov 4**",
      "**Magnitudle** 301/500 · 77 · 60",
      "**Krillion** 410 · 🐟🦑🏮🦑🏮🐟🦑",
      "**Chainle** 3,096 · beat 46% · 🟨🟧🟧🟧🟨",
      "**GeoGuessr** 3,686 pts · best: Poland 3,686",
      "**Farflung** 370/500 km · Common · Rare · Miss",
      "**FactMap** 1,791/5,000 · Wanderer · 219 · 508",
    ].join("\n"));
  });

  it("gives the same lines as HTML, names bold and text escaped, for a rich paste", () => {
    const geoguessr: GameScore = { date: "2026-11-04", game: "geoguessr", score: "5 pts", share: "1. Trinidad & Tobago: 5 pts\nTotal: 5 pts" };
    expect(slackScores("2026-11-04", [geoguessr]).html).toBe(
      "<b>Daily games · Wed, Nov 4</b><br><b>GeoGuessr</b> 5 pts · best: Trinidad &amp; Tobago 5",
    );
  });

  it("is empty when nothing is pasted", () => {
    expect(slackScores("2026-11-04", [])).toEqual({ text: "", html: "" });
  });
});

describe("buildGameRows subtitles", () => {
  it("titles each card by its puzzle number once played, and Magnitudle by its mode, never by a date", () => {
    const magnitudle: GameScore = { date: "2026-11-04", game: "magnitudle", score: "301/500", share: "Magnitudle — Size It Up\n2026-11-04\n\nScore: 301/500" };
    expect(buildGameRows([magnitudle]).map((row) => row.subtitle)).toEqual(["Daily Question", "Size It Up", "Geography", null, null, null, null, null, null]);
  });
});

describe("dayLabel", () => {
  it("names the day the way the copy does", () => {
    expect(dayLabel("2026-11-04")).toBe("Wed, Nov 4");
  });
});

describe("localDate", () => {
  it("is the local calendar day, not the UTC one", () => {
    // 2026-11-05 03:00 UTC is still the evening of Nov 4 in Denver (Vitest pins TZ=America/Denver).
    expect(localDate(new Date("2026-11-05T03:00:00Z"))).toBe("2026-11-04");
  });
});
