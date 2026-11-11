---
schema: cc-dash/roadmap@1
project: daily-games
description: Static daily-games score tracker with per-game history, saved in the browser
last_updated: 2026-11-11T09:15:00-07:00
---

# Daily Games Roadmap

<!-- category:foundation -->
## Foundation

- <!-- id:r_dg001 status:done completed:2026-11-11 --> **Extract the games tile** - Parsers, card view model, card styles and icons copied into a Vite + React app with their tests.
- <!-- id:r_dg002 status:done completed:2026-11-11 --> **Browser storage** - Every result kept in localStorage, with JSON export and an import that also reads JSON Lines files.
- <!-- id:r_dg003 status:done completed:2026-11-11 --> **Publish** - Public GitHub repo, Pages built from Actions, paste and history checked on the live site.
- <!-- id:r_dg004 status:planned --> **Hands-on check of the live site** - Copy for Slack into Slack, Export, and Import of a real file, in a normal browser.

<!-- category:features -->
## Features

- <!-- id:r_dg010 status:done completed:2026-11-11 --> **Today** - Game cards with paste to save, Copy for Slack and Copy full results.
- <!-- id:r_dg011 status:done completed:2026-11-11 --> **Game history pages** - One page per game: streaks, average, best day, score by day, players beaten, round averages or guess distribution, and every result.
- <!-- id:r_dg012 status:planned --> **Add a past day** - Paste a result for a day other than today.
- <!-- id:r_dg013 status:planned --> **Played-days calendar** - A calendar of played days on each game's page.
- <!-- id:r_dg014 status:planned --> **Real share fixtures** - Replace the Farflung and Magnitudle Daily Question fixtures, built from each site's share code, with real pastes.
