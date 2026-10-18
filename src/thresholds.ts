import type { ProcessingRules } from "./processing";

// PDR demonstration cutoffs, not flight rules. Strict comparisons match main.py.
export const transportRules = {
  battery_level_percent: { warning: { below: 65 }, critical: { below: 40 } },
  motor_current_amps: { warning: { above: 3 }, critical: { above: 4 } },
  motor_temperature_c: { warning: { above: 60 }, critical: { above: 80 } },
  wheel_speed_rpm: { warning: { below: 70 }, critical: { below: 40 } },
  joint_status: {
    warning: { equals: ["LIMITED"] },
    critical: { equals: ["FAILED", "FAULT"] },
  },
} satisfies Record<string, ProcessingRules>;

export const surveyRules = {
  solar_bus_voltage_v: { warning: { below: 26.8 }, critical: { below: 25.5 } },
  camera_temperature_c: { warning: { above: 24 }, critical: { above: 30 } },
  traction_slip_percent: { warning: { above: 6 }, critical: { above: 10 } },
  drive_mode: {
    warning: { equals: ["CAUTION"] },
    critical: { equals: ["STOP", "FAULT"] },
  },
} satisfies Record<string, ProcessingRules>;
