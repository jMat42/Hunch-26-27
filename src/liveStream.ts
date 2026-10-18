import source from "./data/transport-live-stream.json";
import type { TelemetryRow } from "./telemetry";

export const liveIntervalMs = source.sample_interval_ms;
const streams: Record<string, Array<string | number>> = source.streams;
const streamKeys = Object.keys(streams);

const length = streams[streamKeys[0]]?.length ?? 0;
if (
  !Number.isInteger(liveIntervalMs) ||
  liveIntervalMs <= 0 ||
  length < 2 ||
  streamKeys.some((key) => streams[key].length !== length)
) {
  throw new Error(
    "Live telemetry streams must have equal lengths and a positive interval",
  );
}

export function createLiveRow(
  index: number,
  timestampMs: number,
): TelemetryRow {
  const position = index % length;
  const values = Object.fromEntries(
    streamKeys.map((key) => [key, streams[key][position]]),
  );
  return {
    ...values,
    robot_id: source.robot_id,
    timestamp_utc: new Date(timestampMs).toISOString(),
    timestamp_unix_ms: timestampMs,
  };
}

export function initialLiveRows(nowMs: number): TelemetryRow[] {
  return [createLiveRow(0, nowMs - liveIntervalMs), createLiveRow(1, nowMs)];
}
