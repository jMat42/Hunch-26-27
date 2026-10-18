import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Download,
  Gauge,
  Layers3,
  Menu,
  Moon,
  Orbit,
  Radio,
  Satellite,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  alertEvents,
  downloadMetricCsv,
  formatDate,
  formatTime,
  formatValue,
  rovers as configuredRovers,
  type Metric,
  type Rover,
} from "./telemetry";
import { createLiveRow, initialLiveRows, liveIntervalMs } from "./liveStream";
import { processReading, type Severity } from "./processing";

const labels: Record<Severity, string> = {
  good: "Nominal",
  warning: "Warning",
  critical: "Critical",
};
const CHART_WINDOW = 30;
const order: Record<Severity, number> = { good: 0, warning: 1, critical: 2 };
type AppPage = "metric" | "alerts" | "fleet";
const pageFromHash = (): AppPage =>
  window.location.hash === "#fleet"
    ? "fleet"
    : window.location.hash === "#alerts"
      ? "alerts"
      : "metric";

function Status({
  level,
  compact = false,
}: {
  level: Severity;
  compact?: boolean;
}) {
  return (
    <span
      className={`status status-${level} ${compact ? "status-compact" : ""}`}
    >
      <span className="status-dot" />
      {labels[level]}
    </span>
  );
}

function IconForMetric({ metric }: { metric: Metric }) {
  if (metric.key.includes("battery") || metric.key.includes("solar"))
    return <Layers3 size={17} />;
  if (metric.key.includes("temperature")) return <Activity size={17} />;
  if (metric.type === "enum") return <Radio size={17} />;
  return <Gauge size={17} />;
}

function MetricChart({ rover, metric }: { rover: Rover; metric: Metric }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ width: 900, height: 269 });
  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const resize = () => {
      const { width, height } = svg.getBoundingClientRect();
      if (width > 0 && height > 0) setSize({ width, height });
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);
  const chartRows = rover.records.slice(-CHART_WINDOW);
  const values = chartRows.map((row) => row[metric.key]);
  const numeric = values.map((value) =>
    typeof value === "number"
      ? value
      : value === "OK" || value === "TRAVERSE"
        ? 0
        : value === "LIMITED" || value === "CAUTION"
          ? 1
          : 2,
  );
  const minRaw = Math.min(...numeric);
  const maxRaw = Math.max(...numeric);
  const pad =
    metric.type === "enum"
      ? 0.45
      : Math.max((maxRaw - minRaw) * 0.27, Math.abs(maxRaw) * 0.025, 0.5);
  const min = metric.type === "enum" ? -0.4 : minRaw - pad;
  const max = metric.type === "enum" ? 2.4 : maxRaw + pad;
  const left = 55,
    right = size.width - 16,
    top = 12,
    bottom = size.height - 46;
  const x = (i: number) =>
    left + (i * (right - left)) / Math.max(1, numeric.length - 1);
  const y = (v: number) => bottom - ((v - min) / (max - min)) * (bottom - top);
  const points = numeric.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const area = `${left},${bottom} ${points} ${right},${bottom}`;
  const ticks =
    metric.type === "enum"
      ? [0, 1, 2]
      : [0, 1, 2, 3, 4].map((i) => min + ((max - min) * i) / 4);
  const enumLabels =
    metric.key === "drive_mode"
      ? ["TRAVERSE", "CAUTION", "FAULT"]
      : ["OK", "LIMITED", "FAULT"];
  const tickText = (v: number) =>
    metric.type === "enum"
      ? (enumLabels[v] ?? "")
      : Math.abs(v) >= 100
        ? v.toFixed(0)
        : v.toFixed(1);
  return (
    <div className="chart-wrap">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${size.width} ${size.height}`}
        role="img"
        aria-label={`${metric.title} readings over time for ${rover.id}`}
      >
        <defs>
          <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#4b9aff" stopOpacity=".18" />
            <stop offset="100%" stopColor="#4b9aff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((tick, i) => (
          <g key={i}>
            <line
              x1={left}
              x2={right}
              y1={y(tick)}
              y2={y(tick)}
              className="chart-grid"
            />
            <text
              x={38}
              y={y(tick) + 4}
              textAnchor="end"
              className="chart-axis"
            >
              {tickText(tick)}
            </text>
          </g>
        ))}
        <line
          x1={left}
          x2={right}
          y1={bottom}
          y2={bottom}
          className="chart-baseline"
        />
        <polygon points={area} fill="url(#chartFill)" />
        <polyline
          points={points}
          fill="none"
          stroke="#69aaff"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {numeric.map((value, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(value)} r="8" className="chart-halo" />
            <circle
              cx={x(i)}
              cy={y(value)}
              r="5"
              className={`chart-point chart-point-${processReading(values[i], metric).status}`}
            >
              <title>{`${formatTime(chartRows[i].timestamp_utc, true)} UTC · ${formatValue(values[i], metric)} ${metric.unit} · ${labels[processReading(values[i], metric).status]}`}</title>
            </circle>
          </g>
        ))}
        {[0, Math.floor((chartRows.length - 1) / 2), chartRows.length - 1].map(
          (i, index) => (
            <text
              key={index}
              x={x(i)}
              y={size.height - 12}
              textAnchor={
                index === 0 ? "start" : index === 2 ? "end" : "middle"
              }
              className="chart-axis time-axis"
            >
              {formatTime(chartRows[i].timestamp_utc)}
            </text>
          ),
        )}
      </svg>
    </div>
  );
}

function MetricPage({
  rover,
  metric,
  live,
}: {
  rover: Rover;
  metric: Metric;
  live: boolean;
}) {
  const rows = [...rover.records].reverse();
  const latest = rows[0];
  const previous = rows[1];
  const { value: current, status: level } = processReading(
    latest[metric.key],
    metric,
  );
  const numeric =
    typeof current === "number" && typeof previous[metric.key] === "number";
  const delta = numeric ? current - (previous[metric.key] as number) : 0;
  const rangeValues = rover.records
    .map((row) => row[metric.key])
    .filter((value): value is number => typeof value === "number");
  const intervalSeconds =
    (latest.timestamp_unix_ms - previous.timestamp_unix_ms) / 1000;
  const intervalLabel =
    intervalSeconds < 60
      ? `${intervalSeconds.toFixed(0)} second`
      : `${(intervalSeconds / 60).toFixed(0)} minute`;
  const chartStart =
    rover.records[Math.max(0, rover.records.length - CHART_WINDOW)];
  const durationSeconds =
    (latest.timestamp_unix_ms - chartStart.timestamp_unix_ms) / 1000;
  const durationLabel =
    durationSeconds < 60
      ? `${durationSeconds.toFixed(0)} sec`
      : `${(durationSeconds / 60).toFixed(0)} min`;
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" />
            {metric.domain} <span className="slash">/</span> {rover.id}
          </div>
          <h1>{metric.title}</h1>
          <p>
            {metric.description} · {rover.source}
          </p>
        </div>
        <button
          className="export-button"
          onClick={() => downloadMetricCsv(rover, metric)}
        >
          <Download size={16} /> Export CSV
        </button>
      </div>
      <div className="summary-grid">
        <div className="summary-card primary-summary">
          <span className="summary-label">LATEST READING</span>
          <div className="reading">
            <span>{formatValue(current, metric)}</span>
            <small>{metric.unit}</small>
          </div>
          <div className="summary-foot">
            <Status level={level} compact />
            <span>at {formatTime(latest.timestamp_utc, true)} UTC</span>
          </div>
        </div>
        <div className="summary-card">
          <span className="summary-label">CHANGE FROM PREVIOUS</span>
          <div className="sub-reading">
            {numeric ? (
              <>
                {delta > 0 ? (
                  <ArrowUpRight size={23} />
                ) : delta < 0 ? (
                  <ArrowDownRight size={23} />
                ) : (
                  <ArrowRight size={23} />
                )}{" "}
                {Math.abs(delta).toFixed(
                  metric.key === "battery_level_percent" ? 0 : 1,
                )}{" "}
                <small>{metric.unit}</small>
              </>
            ) : (
              <>
                {current === previous[metric.key]
                  ? "No change"
                  : `${previous[metric.key]} → ${current}`}
              </>
            )}
          </div>
          <span className="summary-caption">
            {intervalLabel} sample interval
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-label">OBSERVED RANGE</span>
          <div className="sub-reading">
            {rangeValues.length
              ? `${Math.min(...rangeValues).toFixed(metric.key === "battery_level_percent" ? 0 : 1)}–${Math.max(...rangeValues).toFixed(metric.key === "battery_level_percent" ? 0 : 1)}`
              : "State changes"}
            <small>{rangeValues.length ? metric.unit : ""}</small>
          </div>
          <span className="summary-caption">
            Across {rover.records.length} {live ? "simulated" : "recorded"}{" "}
            samples
          </span>
        </div>
      </div>
      <section className="panel chart-panel">
        <div className="panel-head">
          <div>
            <div className="panel-kicker">SIGNAL HISTORY</div>
            <h2>{metric.title} over time</h2>
          </div>
          <span className="panel-pill">
            <span className="tiny-blue-dot" />{" "}
            {live ? "Live simulation" : "Recorded"} · {durationLabel}
          </span>
        </div>
        <MetricChart rover={rover} metric={metric} />
        <div className="chart-footer">
          <span>
            <span className="legend-line" /> Measured value
          </span>
          <span>
            <span className="legend-dot green" /> Nominal
          </span>
          <span>
            <span className="legend-dot yellow" /> Warning
          </span>
          <span>
            <span className="legend-dot red" /> Critical
          </span>
        </div>
      </section>
      <section className="panel log-panel">
        <div className="panel-head">
          <div>
            <div className="panel-kicker">EVENT STREAM</div>
            <h2>Telemetry log</h2>
          </div>
          <span className="count-pill">{rows.length} RECORDS</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>TIME (UTC)</th>
                <th>PARAMETER</th>
                <th>READING</th>
                <th>CHANGE</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const { value, status: state } = processReading(
                  row[metric.key],
                  metric,
                );
                const prior = rows[index + 1]?.[metric.key];
                const change =
                  typeof value === "number" && typeof prior === "number"
                    ? `${value - prior > 0 ? "+" : ""}${(value - prior).toFixed(metric.key === "battery_level_percent" ? 0 : 1)}`
                    : prior === undefined
                      ? "—"
                      : value === prior
                        ? "No change"
                        : `${prior} → ${value}`;
                return (
                  <tr key={row.timestamp_unix_ms}>
                    <td className="time-cell">
                      {formatTime(row.timestamp_utc, true)}{" "}
                      <span>{formatDate(row.timestamp_utc)}</span>
                    </td>
                    <td className="param-cell">{metric.key}</td>
                    <td className="value-cell">
                      {formatValue(value, metric)} <span>{metric.unit}</span>
                    </td>
                    <td className="change-cell">{change}</td>
                    <td>
                      <Status level={state} compact />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function AlertsManager({ rover }: { rover: Rover }) {
  const [filter, setFilter] = useState<"all" | "warning" | "critical">("all");
  const [acknowledged, setAcknowledged] = useState<string[]>(() => {
    try {
      return JSON.parse(
        localStorage.getItem("hunch-acknowledged-alerts") ?? "[]",
      ) as string[];
    } catch {
      return [];
    }
  });
  const toggleAcknowledged = (id: string) =>
    setAcknowledged((previous) => {
      const next = previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id];
      localStorage.setItem("hunch-acknowledged-alerts", JSON.stringify(next));
      return next;
    });
  const events = alertEvents(rover).filter(
    (event) => filter === "all" || event.level === filter,
  );
  const critical = alertEvents(rover).filter(
    (event) => event.level === "critical",
  ).length;
  const warnings = alertEvents(rover).filter(
    (event) => event.level === "warning",
  ).length;
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" /> SYSTEM{" "}
            <span className="slash">/</span> {rover.id}
          </div>
          <h1>Alerts Manager</h1>
          <p>
            Out of range readings across all telemetry sources · Demo thresholds
          </p>
        </div>
      </div>
      <div className="alert-stats">
        <div>
          <span className="alert-stat-icon red">
            <AlertTriangle size={19} />
          </span>
          <span>
            <strong>{critical}</strong>
            <small>Critical events</small>
          </span>
        </div>
        <div>
          <span className="alert-stat-icon yellow">
            <Bell size={19} />
          </span>
          <span>
            <strong>{warnings}</strong>
            <small>Warnings</small>
          </span>
        </div>
        <div>
          <span className="alert-stat-icon green">
            <ShieldCheck size={19} />
          </span>
          <span>
            <strong>
              {
                rover.metrics.filter(
                  (metric) =>
                    processReading(rover.records.at(-1)![metric.key], metric)
                      .status === "good",
                ).length
              }
            </strong>
            <small>Nominal signals now</small>
          </span>
        </div>
      </div>
      <section className="panel manager-panel">
        <div className="panel-head">
          <div>
            <div className="panel-kicker">ALERT FEED</div>
            <h2>Recorded events</h2>
          </div>
          <div className="filter-tabs" role="group" aria-label="Filter alerts">
            {(["all", "critical", "warning"] as const).map((item) => (
              <button
                key={item}
                className={filter === item ? "selected" : ""}
                onClick={() => setFilter(item)}
              >
                {item === "all" ? "All" : labels[item]}
              </button>
            ))}
          </div>
        </div>
        <div className="alert-list">
          {events.length ? (
            events.map((event) => (
              <article
                key={event.id}
                className={`alert-row alert-row-${event.level}`}
              >
                <div className="alert-mark">
                  <AlertTriangle size={17} />
                </div>
                <div className="alert-body">
                  <div className="alert-title">
                    {event.metric.title} <Status level={event.level} compact />
                  </div>
                  <p>
                    {formatValue(event.value, event.metric)} {event.metric.unit}{" "}
                    · {event.metric.key}
                  </p>
                  <small>
                    {formatTime(event.row.timestamp_utc, true)} UTC ·{" "}
                    {formatDate(event.row.timestamp_utc)}
                  </small>
                </div>
                <button
                  className={`ack-button ${acknowledged.includes(event.id) ? "is-acked" : ""}`}
                  onClick={() => toggleAcknowledged(event.id)}
                >
                  {acknowledged.includes(event.id) ? (
                    <>
                      <Check size={14} /> Acknowledged
                    </>
                  ) : (
                    "Acknowledge"
                  )}
                </button>
              </article>
            ))
          ) : (
            <div className="empty-alerts">
              <ShieldCheck size={27} />
              <h3>No matching alerts</h3>
              <p>All readings are within the selected severity filter.</p>
            </div>
          )}
        </div>
      </section>
      <div className="threshold-note">
        <CircleHelp size={16} /> Thresholds here are demonstration choices from{" "}
        <code>main.py</code>, not mission flight limits.
      </div>
    </>
  );
}

function RightRail({
  rover,
  onAlerts,
  live,
}: {
  rover: Rover;
  onAlerts: () => void;
  live: boolean;
}) {
  const events = alertEvents(rover);
  const latest = rover.records.at(-1)!;
  const active = rover.metrics
    .map((metric) => {
      const processed = processReading(latest[metric.key], metric);
      return { metric, value: processed.value, level: processed.status };
    })
    .filter((item) => item.level !== "good")
    .sort((a, b) => order[b.level] - order[a.level]);
  return (
    <aside className="right-rail">
      <div className="rail-top">
        <div>
          <div className="rail-kicker">MISSION CONTROL</div>
          <h2>System status</h2>
        </div>
        <span className="rail-orbit">
          <Satellite size={21} />
        </span>
      </div>
      <div className="health-box">
        <div className="health-heading">
          <span className="pulse-dot" />{" "}
          {active.length ? "ATTENTION REQUIRED" : "ALL SYSTEMS NOMINAL"}
        </div>
        <strong>
          {active.length
            ? `${active.length} signal${active.length === 1 ? "" : "s"} flagged`
            : "Telemetry stable"}
        </strong>
        <p>
          Latest {live ? "simulated" : "recorded"} sample ·{" "}
          {formatTime(latest.timestamp_utc, true)} UTC
        </p>
      </div>
      <div className="rail-section-title">
        <span>ACTIVE CONDITIONS</span>
        <span>{active.length.toString().padStart(2, "0")}</span>
      </div>
      <div className="condition-list">
        {active.length ? (
          active.map((item) => (
            <div
              className={`condition condition-${item.level}`}
              key={item.metric.key}
            >
              <div className="condition-top">
                <span className="condition-name">{item.metric.title}</span>
                <Status level={item.level} compact />
              </div>
              <div className="condition-reading">
                {formatValue(item.value, item.metric)}{" "}
                <span>{item.metric.unit}</span>
              </div>
              <div className="condition-param">{item.metric.key}</div>
            </div>
          ))
        ) : (
          <div className="condition-empty">
            <ShieldCheck size={20} /> All current signals are nominal.
          </div>
        )}
      </div>
      <button className="view-alerts" onClick={onAlerts}>
        Open Alerts Manager <ArrowRight size={15} />
      </button>
      <div className="rail-divider" />
      <div className="rail-section-title">
        <span>RECENT ACTIVITY</span>
        <Clock3 size={14} />
      </div>
      <div className="activity-list">
        {events.slice(0, 4).map((event) => (
          <div className="activity-item" key={event.id}>
            <span className={`activity-dot ${event.level}`} />
            <div>
              <strong>{event.metric.short}</strong>
              <span>
                {formatValue(event.value, event.metric)} {event.metric.unit} ·{" "}
                {labels[event.level]}
              </span>
            </div>
            <time>{formatTime(event.row.timestamp_utc)}</time>
          </div>
        ))}
      </div>
      <div className="rail-bottom">
        <Moon size={17} />
        <span>HUNCH · Lunar surface operations</span>
      </div>
    </aside>
  );
}

function FleetPage({
  onSelect,
  rovers,
}: {
  onSelect: (rover: Rover) => void;
  rovers: Rover[];
}) {
  return (
    <>
      <div className="page-heading fleet-heading">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" /> LUNAR OPERATIONS{" "}
            <span className="slash">/</span> GARAGE
          </div>
          <h1>Rover Fleet</h1>
          <p>Vehicle overview and telemetry entry point</p>
        </div>
        <span className="fleet-count">{rovers.length} VEHICLES</span>
      </div>
      <div className="fleet-intro">
        <Orbit size={18} />
        <div>
          <strong>Garage workspace</strong>
          <span>
            Vehicle models and repair tracking will live here. Current cards
            show telemetry data and current processed conditions.
          </span>
        </div>
      </div>
      <div className="fleet-grid">
        {rovers.map((item, index) => {
          const latest = item.records.at(-1)!;
          const level = item.metrics.reduce<Severity>((highest, metric) => {
            const next = processReading(latest[metric.key], metric).status;
            return order[next] > order[highest] ? next : highest;
          }, "good");
          return (
            <article className="fleet-card" key={item.id}>
              <div className="fleet-card-head">
                <div>
                  <span className="fleet-card-kicker">
                    ROVER {String(index + 1).padStart(2, "0")}
                  </span>
                  <h2>{item.label}</h2>
                  <span>{item.id}</span>
                </div>
                <Status level={level} compact />
              </div>
              <div
                className="rover-render"
                aria-label={`${item.label} model placeholder`}
              >
                <div className="render-grid" />
                <svg
                  viewBox="0 0 420 220"
                  role="img"
                  aria-label="Rover outline placeholder"
                >
                  <ellipse
                    cx="210"
                    cy="185"
                    rx="150"
                    ry="16"
                    fill="#527da31a"
                    stroke="#4b709144"
                  />
                  <path
                    d="M52 177 L368 177 M75 190 L345 190 M110 203 L310 203"
                    stroke="#40607a44"
                    fill="none"
                  />
                  <path
                    d={
                      index === 0
                        ? "M105 105 L127 80 L288 80 L316 105 L314 150 L102 150 Z"
                        : "M120 112 L143 91 L283 91 L306 112 L296 148 L125 148 Z"
                    }
                    fill="#1a2632"
                    stroke="#7799b5"
                    strokeWidth="2"
                  />
                  <path
                    d="M108 112 L315 112 M128 81 L155 111 M288 81 L265 111 M144 146 L110 170 M278 146 L315 170"
                    stroke="#496d8d"
                    fill="none"
                  />
                  <path
                    d="M128 80 L145 68 L272 68 L288 80 M190 68 L190 42 L214 42 M214 42 L228 54"
                    stroke="#8badc9"
                    fill="none"
                    strokeWidth="2"
                  />
                  <circle
                    cx="233"
                    cy="54"
                    r="8"
                    fill="#101820"
                    stroke="#8badc9"
                    strokeWidth="2"
                  />
                  {[105, 168, 252, 315].map((cx) => (
                    <g key={cx}>
                      <circle
                        cx={cx}
                        cy="167"
                        r="19"
                        fill="#101820"
                        stroke="#8badc9"
                        strokeWidth="2"
                      />
                      <circle
                        cx={cx}
                        cy="167"
                        r="8"
                        fill="#283d50"
                        stroke="#688bab"
                      />
                    </g>
                  ))}
                  <path
                    d="M148 96 L275 96"
                    stroke="#94bce0"
                    strokeDasharray="4 7"
                  />
                </svg>
                <span className="model-label">
                  3D MODEL SLOT <span>·</span> CONCEPT PREVIEW
                </span>
              </div>
              <div className="fleet-card-foot">
                <div>
                  <span>ROLE</span>
                  <strong>{item.role}</strong>
                </div>
                <div>
                  <span>TELEMETRY</span>
                  <strong>
                    {item.metrics.length} signals · {item.records.length}{" "}
                    samples
                  </strong>
                </div>
                <div>
                  <span>GARAGE STATE</span>
                  <strong>Not configured</strong>
                </div>
              </div>
              <button className="fleet-open" onClick={() => onSelect(item)}>
                Open telemetry <ArrowRight size={15} />
              </button>
            </article>
          );
        })}
      </div>
    </>
  );
}

export default function App() {
  const [roverId, setRoverId] = useState(configuredRovers[0].id);
  const [metricKey, setMetricKey] = useState(
    configuredRovers[0].metrics[0].key,
  );
  const [sourceMode, setSourceMode] = useState<"live" | "recorded">("live");
  const [liveRows, setLiveRows] = useState(() => initialLiveRows(Date.now()));
  useEffect(() => {
    if (sourceMode !== "live") return;
    const timer = window.setInterval(() => {
      setLiveRows((rows) => [...rows, createLiveRow(rows.length, Date.now())]);
    }, liveIntervalMs);
    return () => window.clearInterval(timer);
  }, [sourceMode]);
  const rovers = useMemo(
    () =>
      configuredRovers.map((item) =>
        item.id === "P2-TRANSPORT-01" && sourceMode === "live"
          ? { ...item, records: liveRows, source: "Simulated live stream" }
          : item,
      ),
    [liveRows, sourceMode],
  );
  const [page, setPage] = useState<AppPage>(pageFromHash);
  useEffect(() => {
    const syncPage = () => setPage(pageFromHash());
    window.addEventListener("hashchange", syncPage);
    return () => window.removeEventListener("hashchange", syncPage);
  }, []);
  const navigate = (next: AppPage) => {
    window.location.hash = next === "metric" ? "telemetry" : next;
    setPage(next);
  };
  const [navOpen, setNavOpen] = useState(false);
  const rover = rovers.find((item) => item.id === roverId)!;
  const isLive = rover.id === "P2-TRANSPORT-01" && sourceMode === "live";
  const metric =
    rover.metrics.find((item) => item.key === metricKey) ?? rover.metrics[0];
  const flagged = useMemo(
    () =>
      rover.metrics.filter(
        (item) =>
          processReading(rover.records.at(-1)![item.key], item).status !==
          "good",
      ).length,
    [rover],
  );
  const selectRover = (next: Rover) => {
    setRoverId(next.id);
    setMetricKey(next.metrics[0].key);
    navigate("metric");
    setNavOpen(false);
  };
  return (
    <div className="app-shell">
      {navOpen && (
        <button
          className="nav-backdrop"
          aria-label="Close navigation"
          onClick={() => setNavOpen(false)}
        />
      )}
      <aside className={`sidebar ${navOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <span className="brand-symbol">
            <Moon size={20} />
            <span />
          </span>
          <div>
            <strong>HUNCH</strong>
            <small>LUNAR TELEMETRY</small>
          </div>
          <button
            className="mobile-close"
            aria-label="Close navigation"
            onClick={() => setNavOpen(false)}
          >
            <X size={18} />
          </button>
        </div>
        <div className="workspace-label">
          WORKSPACE <ChevronDown size={12} />
        </div>
        <div className="workspace-card">
          <div className="workspace-avatar">M1</div>
          <div>
            <strong>Mission Control</strong>
            <span>Surface operations</span>
          </div>
          <ChevronDown size={14} />
        </div>
        <div className="side-separator" />
        <div className="side-label">
          TELEMETRY PAGES{" "}
          <span>{rover.metrics.length.toString().padStart(2, "0")}</span>
        </div>
        <nav className="metric-nav" aria-label="Telemetry pages">
          {rover.metrics.map((item) => {
            const selected = page === "metric" && metric.key === item.key;
            const latest = rover.records.at(-1)![item.key];
            const level = processReading(latest, item).status;
            return (
              <button
                key={item.key}
                className={`nav-item ${selected ? "active" : ""}`}
                onClick={() => {
                  setMetricKey(item.key);
                  navigate("metric");
                  setNavOpen(false);
                }}
              >
                <IconForMetric metric={item} />
                <span>{item.title}</span>
                <i className={`nav-indicator ${level}`} />
              </button>
            );
          })}
        </nav>
        <div className="side-separator second" />
        <div className="side-label">SYSTEM</div>
        <button
          className={`nav-item system-nav ${page === "alerts" ? "active" : ""}`}
          onClick={() => {
            navigate("alerts");
            setNavOpen(false);
          }}
        >
          <Bell size={17} />
          <span>Alerts Manager</span>
          {flagged > 0 && <b>{flagged}</b>}
        </button>
        <div className="sidebar-spacer" />
        <div className="sidebar-info">
          <span className="info-icon">
            <Radio size={16} />
          </span>
          <div>
            <strong>
              {isLive ? "Simulated live telemetry" : "Recorded telemetry"}
            </strong>
            <small>
              {isLive
                ? `New sample every ${liveIntervalMs / 1000} sec`
                : `Demo session · ${formatDate(rover.records[0].timestamp_utc)}`}
            </small>
          </div>
        </div>
        <div className="sidebar-footer">
          <span className="connection-dot" />{" "}
          {isLive ? "SIMULATOR RUNNING" : "DATASET LOADED"}{" "}
          <span className="footer-version">v0.1</span>
        </div>
      </aside>
      <div className="content-shell">
        <header className="topbar">
          <button
            className="mobile-menu"
            aria-label="Open navigation"
            onClick={() => setNavOpen(true)}
          >
            <Menu size={20} />
          </button>
          <button
            className={`topbar-title ${page === "fleet" ? "fleet-active" : ""}`}
            onClick={() => navigate("fleet")}
            aria-label="Open Rover Fleet"
          >
            <span className="topbar-icon">
              <Satellite size={18} />
            </span>
            <span>ROVER FLEET</span>
          </button>
          <div className="rover-tabs" role="tablist" aria-label="Select rover">
            {rovers.map((item) => (
              <button
                role="tab"
                aria-selected={rover.id === item.id}
                key={item.id}
                className={rover.id === item.id ? "selected" : ""}
                onClick={() => selectRover(item)}
              >
                <span className="rover-tab-dot" />
                {item.label}
                <small>{item.id}</small>
              </button>
            ))}
          </div>
          <div className="topbar-right">
            {rover.id === "P2-TRANSPORT-01" ? (
              <button
                className={`session-badge session-toggle ${isLive ? "session-live" : ""}`}
                onClick={() => setSourceMode(isLive ? "recorded" : "live")}
                aria-label={
                  isLive
                    ? "Switch to recorded telemetry"
                    : "Switch to live simulation"
                }
                title={
                  isLive
                    ? "Show original Mission 1 readings"
                    : "Show simulated streaming readings"
                }
              >
                <span /> {isLive ? "LIVE SIMULATION" : "RECORDED SESSION"}
              </button>
            ) : (
              <span className="session-badge">
                <span /> RECORDED DEMO
              </span>
            )}
            <span className="topbar-time">
              {formatDate(rover.records.at(-1)!.timestamp_utc)} ·{" "}
              {formatTime(rover.records.at(-1)!.timestamp_utc)} UTC
            </span>
          </div>
        </header>
        <div className="content-row">
          <main className="main-content">
            <div className="mobile-rover-tabs" aria-label="Select rover">
              {rovers.map((item) => (
                <button
                  key={item.id}
                  className={rover.id === item.id ? "selected" : ""}
                  onClick={() => selectRover(item)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="main-inner">
              {page === "fleet" ? (
                <FleetPage onSelect={selectRover} rovers={rovers} />
              ) : page === "metric" ? (
                <MetricPage rover={rover} metric={metric} live={isLive} />
              ) : (
                <AlertsManager rover={rover} />
              )}
            </div>
          </main>
          {page !== "fleet" && (
            <RightRail
              rover={rover}
              onAlerts={() => navigate("alerts")}
              live={isLive}
            />
          )}
        </div>
        <footer className="statusbar">
          <span>
            <span className="connection-dot" />{" "}
            {isLive ? "Simulator running" : "Dataset loaded"}{" "}
            <span className="statusbar-muted">
              / {rover.records.length} samples / {rover.id}
            </span>
          </span>
          <span className="statusbar-right">
            <Search size={13} /> Read-only mission demo{" "}
            <span className="statusbar-divider" /> UTC{" "}
            <span className="statusbar-divider" /> HUNCH 26–27
          </span>
        </footer>
      </div>
    </div>
  );
}
