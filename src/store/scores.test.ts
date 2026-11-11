import { describe, expect, it } from "vitest";
import { createScoreStore, STORAGE_KEY } from "./scores";

const KRILLION = "Krillion #112 🦐\n410\n\n🐟🦑🏮🦑🏮🐟🦑";
const KRILLION_NEXT = "Krillion #113 🦐\n290\n\n🫧🦑🦑🦑🦑🐟🫧";
const CHAINLE = "Chainle #77 · 3,096 🔗\nBeat 46% of players\n🟨🟧🟧🟧🟨\nhttps://chainle.io";

const memory = (initial: Record<string, string> = {}) => {
  const items = new Map(Object.entries(initial));
  return {
    items,
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
  };
};

describe("score store", () => {
  it("starts empty when nothing has been saved", () => {
    expect(createScoreStore(memory()).all()).toEqual([]);
  });

  it("saves a pasted share with its date and the score its parser reads, and keeps it in storage", () => {
    const storage = memory();
    const saved = createScoreStore(storage).save({ date: "2026-11-04", game: "krillion", share: `  ${KRILLION}\n` });
    const entry = { date: "2026-11-04", game: "krillion", score: "410", share: KRILLION };
    expect(saved).toEqual([entry]);
    expect(JSON.parse(storage.items.get(STORAGE_KEY)!)).toEqual([entry]);
    expect(createScoreStore(storage).all()).toEqual([entry]);
  });

  it("keeps every day: a later day's paste adds to the history", () => {
    const store = createScoreStore(memory());
    store.save({ date: "2026-11-04", game: "krillion", share: KRILLION });
    expect(store.save({ date: "2026-11-05", game: "krillion", share: KRILLION_NEXT })).toEqual([
      { date: "2026-11-04", game: "krillion", score: "410", share: KRILLION },
      { date: "2026-11-05", game: "krillion", score: "290", share: KRILLION_NEXT },
    ]);
  });

  it("replaces the same game's result on the same day", () => {
    const store = createScoreStore(memory());
    store.save({ date: "2026-11-04", game: "krillion", share: KRILLION });
    expect(store.save({ date: "2026-11-04", game: "krillion", share: KRILLION_NEXT })).toEqual([
      { date: "2026-11-04", game: "krillion", score: "290", share: KRILLION_NEXT },
    ]);
  });

  it("refuses a share that is not the game's, and saves nothing", () => {
    const storage = memory();
    expect(() => createScoreStore(storage).save({ date: "2026-11-04", game: "wordle", share: KRILLION })).toThrow("Not a Wordle share");
    expect(storage.items.size).toBe(0);
  });

  it("fails loudly on saved data it cannot read", () => {
    expect(() => createScoreStore(memory({ [STORAGE_KEY]: "{oops" })).all()).toThrow("Saved scores are unreadable");
    expect(() => createScoreStore(memory({ [STORAGE_KEY]: '[{"date":"2026-11-04","game":"tetris","share":"x"}]' })).all())
      .toThrow('Saved scores are unreadable: entry 1 names an unknown game "tetris"');
  });

  it("exports what it holds and imports it back into an empty browser", () => {
    const first = createScoreStore(memory());
    first.save({ date: "2026-11-04", game: "krillion", share: KRILLION });
    first.save({ date: "2026-11-04", game: "chainle", share: CHAINLE });
    const second = createScoreStore(memory());
    expect(second.importScores(first.exportText())).toEqual({ added: 2, replaced: 0 });
    expect(second.all()).toEqual(first.all());
  });

  it("imports one JSON object per line, as a JSON Lines file is written, the later line of a day winning", () => {
    const store = createScoreStore(memory());
    store.save({ date: "2026-11-05", game: "krillion", share: KRILLION_NEXT });
    const lines = [
      JSON.stringify({ date: "2026-11-04", game: "krillion", score: "410", share: KRILLION_NEXT }),
      JSON.stringify({ date: "2026-11-04", game: "krillion", score: "410", share: KRILLION }),
      JSON.stringify({ date: "2026-11-05", game: "krillion", score: "410", share: KRILLION }),
    ].join("\n");
    expect(store.importScores(`${lines}\n`)).toEqual({ added: 1, replaced: 1 });
    expect(store.all()).toEqual([
      { date: "2026-11-04", game: "krillion", score: "410", share: KRILLION },
      { date: "2026-11-05", game: "krillion", score: "410", share: KRILLION },
    ]);
  });

  it("refuses an import with a bad entry and changes nothing", () => {
    const storage = memory();
    const store = createScoreStore(storage);
    const bad = JSON.stringify([{ date: "2026-11-04", game: "krillion", share: KRILLION }, { date: "Nov 4", game: "krillion", share: KRILLION }]);
    expect(() => store.importScores(bad)).toThrow('entry 2 has the date "Nov 4", not YYYY-MM-DD');
    expect(() => store.importScores("not json")).toThrow("Not a scores file");
    expect(storage.items.size).toBe(0);
  });
});
