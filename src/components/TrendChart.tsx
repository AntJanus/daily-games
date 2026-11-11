import { type KeyboardEvent, type PointerEvent, useEffect, useRef, useState } from "react";
import type { Chart } from "../ui/history";

const HEIGHT = 220;
const MARGIN = { top: 28, right: 20, bottom: 26, left: 44 };
const DAY = 86_400_000;
const dayNumber = (date: string) => Date.parse(`${date}T00:00:00Z`) / DAY;

const useWidth = () => {
  const holder = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = holder.current;
    if (!element) return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return { holder, width };
};

// One series over calendar days: days not played leave a gap in spacing, so a missed week reads as a missed week.
export function TrendChart({ chart }: { chart: Chart }) {
  const { holder, width } = useWidth();
  const [active, setActive] = useState<number | null>(null);
  const { points, axis } = chart;

  const plotWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const firstDay = points.length ? dayNumber(points[0].date) : 0;
  const span = points.length ? dayNumber(points.at(-1)!.date) - firstDay : 0;
  const xOf = (date: string) => MARGIN.left + (span === 0 ? plotWidth / 2 : ((dayNumber(date) - firstDay) / span) * plotWidth);
  const yOf = (value: number) => MARGIN.top + plotHeight - ((value - axis.min) / (axis.max - axis.min)) * plotHeight;
  const placed = points.map((point) => ({ ...point, x: xOf(point.date), y: yOf(point.value) }));

  const nearest = (clientX: number, left: number) => {
    const pointerX = clientX - left;
    return placed.reduce((best, point, index) => (Math.abs(point.x - pointerX) < Math.abs(placed[best].x - pointerX) ? index : best), 0);
  };
  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => setActive(nearest(event.clientX, event.currentTarget.getBoundingClientRect().left));
  const onKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const step = event.key === "ArrowLeft" ? -1 : 1;
    setActive((current) => Math.min(placed.length - 1, Math.max(0, (current ?? placed.length - 1) + step)));
  };

  // First, last, and the middle when there is room: the axis names the range, the tooltip names each day.
  const dateLabels = placed.filter((_, index) =>
    index === 0 || index === placed.length - 1 || (placed.length >= 5 && plotWidth >= 420 && index === Math.floor(placed.length / 2)));
  const last = placed.at(-1);
  const focus = active === null ? null : placed[active];

  return (
    <div className="chart" ref={holder}>
      {width > 0 && placed.length > 0 && (
        <svg
          height={HEIGHT} role="img" tabIndex={0}
          aria-label={`${chart.title}: ${placed.length} days from ${placed[0].label} to ${last!.label}. Use the arrow keys to read each day.`}
          onPointerMove={onPointerMove} onPointerLeave={() => setActive(null)} onKeyDown={onKeyDown} onBlur={() => setActive(null)}
        >
          {axis.ticks.map((tick) => (
            <g key={tick.value}>
              <line className="grid" x1={MARGIN.left} x2={width - MARGIN.right} y1={yOf(tick.value)} y2={yOf(tick.value)} />
              <text className="tick" x={MARGIN.left - 8} y={yOf(tick.value)} textAnchor="end" dominantBaseline="middle">{tick.label}</text>
            </g>
          ))}
          {dateLabels.map((point, index) => (
            <text
              key={point.date} className="tick" x={point.x} y={HEIGHT - 6}
              textAnchor={placed.length === 1 ? "middle" : index === 0 ? "start" : index === dateLabels.length - 1 ? "end" : "middle"}
            >
              {point.label}
            </text>
          ))}
          {focus && <line className="cross" x1={focus.x} x2={focus.x} y1={MARGIN.top} y2={MARGIN.top + plotHeight} />}
          <polyline className="line" points={placed.map((point) => `${point.x},${point.y}`).join(" ")} />
          {placed.map((point, index) => <circle key={point.date} className="dot" cx={point.x} cy={point.y} r={index === active ? 6 : 4} />)}
          {last && !focus && <text className="end" x={last.x} y={last.y - 12} textAnchor={placed.length === 1 ? "middle" : "end"}>{last.display}</text>}
        </svg>
      )}
      {focus && (
        <div className="chart-tip" role="status" style={{ left: Math.min(width - 70, Math.max(70, focus.x)) }}>
          <b>{focus.display}</b>{focus.label}
        </div>
      )}
    </div>
  );
}
