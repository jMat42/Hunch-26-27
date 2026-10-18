import { useMemo, useState } from "react";
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
  rovers,
  severity,
  type Metric,
  type Rover,
  type Severity,
} from "./telemetry";

const labels: Record<Severity, string> = {
  good: "Nominal",
  warning: "Warning",
  critical: "Critical",
};
const order: Record<Severity, number> = { good: 0, warning: 1, critical: 2 };

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
  const values = rover.records.map((row) => row[metric.key]);
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
  const left = 52,
    right = 856,
    top = 22,
    bottom = 240;
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
        viewBox="0 0 900 286"
        role="img"
        aria-label={`${metric.title} readings over time for ${rover.id}`}
        preserveAspectRatio="none"
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
              className={`chart-point chart-point-${severity(values[i], metric)}`}
            >
              <title>{`${formatTime(rover.records[i].timestamp_utc, true)} UTC · ${formatValue(values[i], metric)} ${metric.unit} · ${labels[severity(values[i], metric)]}`}</title>
            </circle>
          </g>
        ))}
        {[
          0,
          Math.floor((rover.records.length - 1) / 2),
          rover.records.length - 1,
        ].map((i, index) => (
          <text
            key={index}
            x={x(i)}
            y={271}
            textAnchor={index === 0 ? "start" : index === 2 ? "end" : "middle"}
            className="chart-axis time-axis"
          >
            {formatTime(rover.records[i].timestamp_utc)}
          </text>
        ))}
      </svg>
    </div>
  );
}

function MetricPage({ rover, metric }: { rover: Rover; metric: Metric }) {
  const rows = [...rover.records].reverse();
  const latest = rows[0];
  const previous = rows[1];
  const current = latest[metric.key];
  const level = severity(current, metric);
  const numeric =
    typeof current === "number" && typeof previous[metric.key] === "number";
  const delta = numeric ? current - (previous[metric.key] as number) : 0;
  const rangeValues = rover.records
    .map((row) => row[metric.key])
    .filter((value): value is number => typeof value === "number");
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
            {(latest.timestamp_unix_ms - previous.timestamp_unix_ms) / 60000}{" "}
            minute sample interval
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
            Across {rover.records.length} recorded samples
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
            <span className="tiny-blue-dot" /> Recorded ·{" "}
            {(latest.timestamp_unix_ms - rover.records[0].timestamp_unix_ms) /
              60000}{" "}
            min
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
                const value = row[metric.key];
                const prior = rows[index + 1]?.[metric.key];
                const state = severity(value, metric);
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
                    severity(rover.records.at(-1)![metric.key], metric) ===
                    "good",
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
}: {
  rover: Rover;
  onAlerts: () => void;
}) {
  const events = alertEvents(rover);
  const latest = rover.records.at(-1)!;
  const active = rover.metrics
    .map((metric) => ({
      metric,
      value: latest[metric.key],
      level: severity(latest[metric.key], metric),
    }))
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
          Latest recorded sample · {formatTime(latest.timestamp_utc, true)} UTC
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

export default function App() {
  const [roverId, setRoverId] = useState(rovers[0].id);
  const [metricKey, setMetricKey] = useState(rovers[0].metrics[0].key);
  const [page, setPage] = useState<"metric" | "alerts">("metric");
  const [navOpen, setNavOpen] = useState(false);
  const rover = rovers.find((item) => item.id === roverId)!;
  const metric =
    rover.metrics.find((item) => item.key === metricKey) ?? rover.metrics[0];
  const flagged = useMemo(
    () =>
      rover.metrics.filter(
        (item) => severity(rover.records.at(-1)![item.key], item) !== "good",
      ).length,
    [rover],
  );
  const selectRover = (next: Rover) => {
    setRoverId(next.id);
    setMetricKey(next.metrics[0].key);
    setPage("metric");
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
            <strong>
              HUNCH<span> / </span>GS
            </strong>
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
            const level = severity(latest, item);
            return (
              <button
                key={item.key}
                className={`nav-item ${selected ? "active" : ""}`}
                onClick={() => {
                  setMetricKey(item.key);
                  setPage("metric");
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
            setPage("alerts");
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
            <strong>Recorded telemetry</strong>
            <small>
              Demo session · {formatDate(rover.records[0].timestamp_utc)}
            </small>
          </div>
        </div>
        <div className="sidebar-footer">
          <span className="connection-dot" /> SOURCE READY{" "}
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
          <div className="topbar-title">
            <span className="topbar-icon">
              <Satellite size={18} />
            </span>
            <span>ROVER FLEET</span>
          </div>
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
            <span className="session-badge">
              <span /> RECORDED SESSION
            </span>
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
              {page === "metric" ? (
                <MetricPage rover={rover} metric={metric} />
              ) : (
                <AlertsManager rover={rover} />
              )}
            </div>
          </main>
          <RightRail rover={rover} onAlerts={() => setPage("alerts")} />
        </div>
        <footer className="statusbar">
          <span>
            <span className="connection-dot" /> Dataset loaded{" "}
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
