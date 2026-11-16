# Daily Games

A static React app (Vite) that tracks daily game results pasted from each game's Share button. Public, for sharing
with colleagues, deployed to GitHub Pages. No server: every result lives in the visitor's `localStorage`.

It began as one tile of a private local dashboard, which keeps its own copy. The parsers, card view model and card
styles were copied as they were.

## Run

```bash
npm run dev        # http://localhost:4880
npm test           # Vitest, the full suite
npm run typecheck
npm run build      # typecheck, then dist/
```

## How it fits together

| Layer | Path | Notes |
|---|---|---|
| Core | `src/core/` | Pure. `games.ts` lists the games; `game-share.ts` has one strict parser per game, which refuses another game's paste; `game-stats.ts` turns a share into numbers for charts |
| Store | `src/store/scores.ts` | `createScoreStore(storage)`: every result under the one key `daily-games/scores/v1`, as a JSON list. Takes any `getItem`/`setItem` pair, so tests use a Map |
| View model | `src/ui/` | Pure. `games.ts` builds today's cards and the Slack and full-results text; `history.ts` builds a game's page; `route.ts` reads the hash |
| UI | `src/components/`, `src/App.tsx` | `GamesTile` (today), `GamePage` and `TrendChart` (history), `DataPanel` (export and import) |

## Rules worth knowing

- **Nothing is ever trimmed.** A paste replaces only the same game on the same day. Stored data that fails to parse
  stops the app with the reason; it is never dropped or reset.
- **The score is always read from the share text.** Imports ignore a file's `score` field and parse the share
  again, so stored entries can never disagree with their text.
- **Import takes two formats**: this app's export (a JSON list) and one JSON object per line (JSON Lines), which is
  how the original dashboard stores its scores. A bad entry refuses the whole file.
- **"Today" is the browser's local day**, read when the page renders.
- **Hash routes** (`#/`, `#/game/<game>`) and `base: "./"` in `vite.config.ts` keep the build working at any GitHub
  Pages path without naming the repo. Icon paths are relative for the same reason.
- **A changed share format** needs its parser and the fixture in `src/core/game-share.test.ts` updated, and the parser
  must keep reading the old format, because stored results are parsed again on every load. Magnitudle's Daily Question
  and Size It Up changed in November 2026 from "Magnitudle — <mode>" over a day to "<mode>" over `#<number>`, and their
  parsers list both openings; Geography still reads only the dated one. The Farflung fixtures were built from the site's share code, not pasted; swap in a real
  paste when one comes in.
- **A new game** is a new entry in `GAMES`, a parser, a `SCALES` entry, its link, icon and names in `src/ui/games.ts`,
  and an icon in `public/games/`. TypeScript flags each missing record.
- **A missed Wordle counts as 7** (`WORDLE_MISS`) in the chart, the average and the distribution, and prints as X.
- **Charts** are hand-written SVG and CSS with one series in `--accent`; text stays in text tokens. The "Every day"
  list under them is the table view of the same data. The trend chart answers pointer hover and the arrow keys.
- **Fonts are the system stack.** This app deliberately loads no webfont.
- **Tests are pure.** There is no DOM test environment: logic lives in `core`, `store` and `ui` so it can be tested
  without one, and the components only draw what those return.

## Before publishing

This repo is public. Keep out of it: anything from the original dashboard beyond the games code, employer names, internal
URLs, and real score exports. Run `/publish-check` on the diff before pushing.
