// Health assessment stays outside raw telemetry. These are demo thresholds,
// equivalent to the existing Mission 1 dashboard rules, not flight limits.
export type Severity = "good" | "warning" | "critical";
export type ThresholdRule = {
  below?: number;
  above?: number;
  equals?: string[];
};
export type ProcessingRules = {
  warning?: ThresholdRule;
  critical?: ThresholdRule;
};
export type ProcessedReading = {
  value: string | number;
  status: Severity;
};

function matches(value: string | number, rule?: ThresholdRule): boolean {
  if (!rule) return false;
  if (typeof value === "number") {
    return (
      (rule.below !== undefined && value < rule.below) ||
      (rule.above !== undefined && value > rule.above)
    );
  }
  return rule.equals?.includes(value.toUpperCase()) ?? false;
}

export function processReading(
  value: string | number,
  rules: ProcessingRules,
): ProcessedReading {
  const status = matches(value, rules.critical)
    ? "critical"
    : matches(value, rules.warning)
      ? "warning"
      : "good";
  return { value, status };
}
