# Daily Games

Paste the share text from your daily games, see today's scores as cards, copy them for Slack, and watch each game
over time. Everything is saved in your browser's `localStorage`: there is no account and no server.

Games: Magnitudle (Daily Question, Size It Up, Geography), Krillion, Chainle, GeoGuessr, Farflung, FactMap and Wordle.

## Use

- **Today** — paste a game's share text into its card. It saves at once; pasting again the same day replaces it.
- **Copy for Slack** puts one line per game on the clipboard; **Copy full results** copies every share text.
- **History** on a card, or a game's name in the header, opens that game's page: streaks, average, best day, score
  by day, and every result.
- **Export** downloads every result as JSON; **Import** merges a file back in. Clearing the browser's site data
  deletes your scores, so export now and then.

## Develop

```bash
npm install
npm run dev      # http://localhost:4880
npm test
npm run build
```

Pushing to `main` builds and publishes to GitHub Pages (`.github/workflows/deploy.yml`).
