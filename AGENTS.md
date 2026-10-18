# HUNCH 26–27 telemetry project notes

## Source telemetry: preserve it

The six original Mission 1 readings for `P2-TRANSPORT-01` are demonstration data. Do not edit, regenerate, or reformat these existing files while working on the dashboard:

- `simulated_mission1_telemetry.json` and `.csv`: readable copies of the same six rows.
- `simulated_mission1_telemetry.parquet`: columnar copy.
- `simulated_mission1_telemetry.h5`: HDF5 copy, with datasets under `/telemetry`.
- `simulated_mission1_ccsds_packets.bin`: six concatenated CCSDS-style packets. Each has a six-byte primary header, then a big-endian demo payload containing `timestamp_unix_ms` (uint64), four measurements (float32), and `joint_status` (uint8).
- `llaso_p4_demo.xtce.xml`: minimal XTCE-style definitions for the demo parameters. Joint values are `OK=0`, `LIMITED=1`, `FAULT=2`.

The JSON/CSV row schema is `robot_id` (string), `timestamp_utc` (ISO 8601 UTC string), `timestamp_unix_ms` (integer), `battery_level_percent` (number), `motor_current_amps` (number), `motor_temperature_c` (number), `wheel_speed_rpm` (number), and `joint_status` (string). There is **no motor voltage field** in this source. Do not label motor current as voltage.

`README_Telemetry.md` is the source overview. These records, the APID, the packet layout, XTCE, and thresholds are PDR demonstration choices, not NASA flight requirements or a full CCSDS/XTCE implementation.

## Frontend data boundary

`src/telemetry.ts` adapts records to rover and metric definitions. Pages, units, labels, and alert rules live in the metric configuration rather than in chart or table components. To add a real rover, supply normalized records with its `robot_id` and timestamps, then define its metrics and units. A new field can be shown by adding a metric definition; the current demo does not invent a motor voltage reading.

The transport dashboard uses the source JSON directly. Its alert cutoffs reproduce `main.py`: battery warning below 65%, critical below 40%; motor current warning above 3 A, critical above 4 A; motor temperature warning above 60 °C, critical above 80 °C; wheel speed warning below 70 RPM, critical below 40 RPM; joint `LIMITED` is warning and `FAILED` is critical. The XTCE enum uses `FAULT`; the frontend also treats `FAULT` as critical. Keep any future operational thresholds in separate configuration and get them reviewed before using them as flight rules.

`src/data/survey-demo.json` is a clearly labeled, additional UI-only sample for testing rover switching and differing schemas. It does not replace or modify any of the original telemetry.

## Design and handoff

Use `C:/Users/matth/projects/ULA-GS` for the dashboard layout reference: left telemetry page rail, chart card, event log, right alerts rail, and restrained mission-control styling. This project's surfaces should be nearly black with small blue accents; green means nominal, yellow warning, and red critical. Dark mode is the initial theme. Do not add the `GS` label to the branding.

Keep `design/rover-dashboard.svg`, `design/alerts-manager.svg`, and `design/rover-fleet.svg` as editable, layered vector handoffs for Figma. Update them when any screen materially changes. The SVGs are design frames, while the React frontend is the interactive implementation. Regenerate the dashboard frame before the other two because their generators read it.
