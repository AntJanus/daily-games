import type { Game, GameScore } from "../core/games";
import { type Breakdown, buildGameHistory, type Chart } from "../ui/history";
import { TrendChart } from "./TrendChart";

function ChartTile({ chart, wide }: { chart: Chart; wide: boolean }) {
  return (
    <section className={`ov-tile${wide ? " gh-span" : ""}`}>
      <h2>{chart.title.toUpperCase()}</h2>
      <p className="gh-note">{chart.note}</p>
      <TrendChart chart={chart} />
    </section>
  );
}

function BreakdownTile({ breakdown }: { breakdown: Breakdown }) {
  return (
    <section className="ov-tile">
      <h2>{breakdown.title.toUpperCase()}</h2>
      <ul className="bars">
        {breakdown.bars.map((bar) => (
          <li key={bar.label}>
            <span className="bar-label">{bar.label}</span>
            <span className="bar-track">
              <span className="bar-fill" data-empty={bar.value === 0} style={{ width: `${breakdown.max > 0 ? (bar.value / breakdown.max) * 85 : 0}%` }} />
              <span className="bar-value">{bar.display}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function GamePage({ game, scores, today }: { game: Game; scores: GameScore[]; today: string }) {
  const history = buildGameHistory(game, scores, today);
  const sideTiles = (history.percentile ? 1 : 0) + (history.breakdown ? 1 : 0);
  return (
    <>
      <section className="ov-tile gh-head">
        <a className="gh-game-link" href={history.href} target="_blank" rel="noreferrer" title={`Open ${history.name} in a new tab`}>
          <img src={history.icon} alt="" width={48} height={48} />
          <div>
            <h1>{history.title}</h1>
            {history.subtitle && <span>{history.subtitle}</span>}
          </div>
        </a>
        <a className="btn btn-lg" href={history.href} target="_blank" rel="noreferrer">Play ↗</a>
      </section>
      <div className="gh-stats">
        {history.tiles.map((tile) => (
          <section key={tile.label} className="ov-tile gh-stat">
            <h2>{tile.label.toUpperCase()}</h2>
            <b className="num">{tile.value}</b>
            {tile.caption && <span>{tile.caption}</span>}
          </section>
        ))}
      </div>
      {history.days.length === 0 && (
        <section className="ov-tile">
          <p className="gh-empty">No {history.name} results yet. Paste one on <a href="#/">Today</a> and it shows up here.</p>
        </section>
      )}
      {history.days.length > 0 && (
        <>
          <div className="gh-charts">
            <ChartTile chart={history.trend} wide={sideTiles !== 1} />
            {history.percentile && <ChartTile chart={history.percentile} wide={false} />}
            {history.breakdown && <BreakdownTile breakdown={history.breakdown} />}
          </div>
          <section className="ov-tile">
            <h2>EVERY DAY</h2>
            <ul className="gh-days">
              {history.days.map((day) => (
                <li key={day.date}>
                  <details>
                    <summary>
                      <span className="day">{day.label}</span>
                      <span className="score">{day.score}</span>
                      <ul className="ov-game-details">{day.highlights.map((highlight, index) => <li key={index}>{highlight}</li>)}</ul>
                    </summary>
                    <pre>{day.share}</pre>
                  </details>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </>
  );
}
