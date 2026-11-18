// The daily games the overview tracks, in the order the tile lists them. Pure, so the browser can import it.
export const GAMES = [
  "magnitudle-daily", "magnitudle", "magnitudle-geography", "krillion", "chainle", "geoguessr", "farflung", "factmap", "wordle",
] as const;
export type Game = (typeof GAMES)[number];

export type GameScore = { date: string; game: Game; score: string; share: string };
