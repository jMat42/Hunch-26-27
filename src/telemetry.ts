import transportData from "../simulated_mission1_telemetry.json";
import surveyData from "./data/survey-demo.json";
import { processReading, type ProcessingRules } from "./processing";
import { surveyRules, transportRules } from "./thresholds";

export type TelemetryRow = Record<string, string | number> & {
  robot_id: string;
  timestamp_utc: string;
  timestamp_unix_ms: number;
};
export type Metric = ProcessingRules & {
  key: string;
  title: string;
  short: string;
  unit: string;
  domain: string;
  description: string;
  type?: "enum";
};
export type Rover = {
  id: string;
  label: string;
  role: string;
  source: string;
  records: TelemetryRow[];
  metrics: Metric[];
};

// Adapter boundary: a new rover only needs normalized rows and metric definitions.
// These demo thresholds reproduce main.py for the transport rover; they are not flight rules.
export const rovers: Rover[] = [
  {
    id: "P2-TRANSPORT-01",
    label: "Transport 01",
    role: "Cargo transport rover",
    source: "Mission 1 source data",
    records: transportData as TelemetryRow[],
    metrics: [
      {
        key: "battery_level_percent",
        title: "Battery Level",
        short: "Battery",
        unit: "%",
        domain: "Power system",
        description: "Remaining battery charge",
        ...transportRules.battery_level_percent,
      },
      {
        key: "motor_current_amps",
        title: "Motor Current",
        short: "Motor current",
        unit: "A",
        domain: "Drive system",
        description: "Current draw at the drive motor",
        ...transportRules.motor_current_amps,
      },
      {
        key: "motor_temperature_c",
        title: "Motor Temperature",
        short: "Motor temp",
        unit: "°C",
        domain: "Thermal system",
        description: "Drive motor housing temperature",
        ...transportRules.motor_temperature_c,
      },
      {
        key: "wheel_speed_rpm",
        title: "Wheel Speed",
        short: "Wheel speed",
        unit: "RPM",
        domain: "Drive system",
        description: "Wheel rotation rate",
        ...transportRules.wheel_speed_rpm,
      },
      {
        key: "joint_status",
        title: "Joint Status",
        short: "Joint status",
        unit: "",
        domain: "Mobility system",
        description: "Articulation joint operating state",
        type: "enum",
        ...transportRules.joint_status,
      },
    ],
  },
  {
    id: "P2-SURVEY-02",
    label: "Survey 02",
    role: "Surface survey rover",
    source: "Additional UI demo data",
    records: surveyData as TelemetryRow[],
    metrics: [
      {
        key: "solar_bus_voltage_v",
        title: "Solar Bus Voltage",
        short: "Solar bus",
        unit: "V",
        domain: "Power system",
        description: "Solar bus output voltage",
        ...surveyRules.solar_bus_voltage_v,
      },
      {
        key: "camera_temperature_c",
        title: "Camera Temperature",
        short: "Camera temp",
        unit: "°C",
        domain: "Imaging system",
        description: "Camera body temperature",
        ...surveyRules.camera_temperature_c,
      },
      {
        key: "traction_slip_percent",
        title: "Traction Slip",
        short: "Traction slip",
        unit: "%",
        domain: "Mobility system",
        description: "Estimated wheel slip",
        ...surveyRules.traction_slip_percent,
      },
      {
        key: "drive_mode",
        title: "Drive Mode",
        short: "Drive mode",
        unit: "",
        domain: "Mobility system",
        description: "Current mobility controller mode",
        type: "enum",
        ...surveyRules.drive_mode,
      },
    ],
  },
];

export function formatValue(value: string | number, metric: Metric): string {
  if (typeof value === "string") return value;
  if (metric.key === "battery_level_percent") return value.toFixed(0);
  return value.toFixed(1);
}

export function formatTime(iso: string, seconds = false): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: seconds ? "2-digit" : undefined,
    hour12: false,
    timeZone: "UTC",
  }).format(date);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(new Date(iso))
    .toUpperCase();
}

export function alertEvents(rover: Rover) {
  return rover.records
    .flatMap((row) =>
      rover.metrics.flatMap((metric) => {
        const value = row[metric.key];
        if (value === undefined) return [];
        const processed = processReading(value, metric);
        const level = processed.status;
        return level === "good"
          ? []
          : [
              {
                id: `${rover.id}-${metric.key}-${row.timestamp_unix_ms}`,
                rover,
                metric,
                row,
                value: processed.value,
                level,
              },
            ];
      }),
    )
    .sort((a, b) => b.row.timestamp_unix_ms - a.row.timestamp_unix_ms);
}

export function downloadMetricCsv(rover: Rover, metric: Metric) {
  const escape = (value: string | number) =>
    `"${String(value).replaceAll('"', '""')}"`;
  const lines = [
    "robot_id,timestamp_utc,parameter,value,unit,status",
    ...rover.records.map((row) =>
      [
        rover.id,
        row.timestamp_utc,
        metric.key,
        row[metric.key],
        metric.unit,
        processReading(row[metric.key], metric).status,
      ]
        .map(escape)
        .join(","),
    ),
  ];
  const url = URL.createObjectURL(
    new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `${rover.id}_${metric.key}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
