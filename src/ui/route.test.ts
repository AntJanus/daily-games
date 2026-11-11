import { describe, expect, it } from "vitest";
import { gameHref, parseRoute } from "./route";

describe("parseRoute", () => {
  it("opens on today", () => {
    expect(parseRoute("")).toEqual({ page: "today" });
    expect(parseRoute("#/")).toEqual({ page: "today" });
  });

  it("opens a game's history from the link the cards use", () => {
    expect(parseRoute(gameHref("magnitudle-geography"))).toEqual({ page: "game", game: "magnitudle-geography" });
  });

  it("names a link it does not know rather than guessing a page", () => {
    expect(parseRoute("#/game/tetris")).toEqual({ page: "unknown", hash: "#/game/tetris" });
  });
});
