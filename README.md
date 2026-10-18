# HUNCH lunar telemetry dashboard

Dark-mode frontend for synthetic Mission 1 telemetry. Transport 01 opens in a simulated live mode, with a button in the top bar to switch to the untouched six original Mission 1 readings. Survey 02 remains an additional recorded UI demo for rover switching and a different telemetry schema.

## Run

```bash
npm install
npm run dev
```

Build with `npm run build`.

The left sidebar switches telemetry pages, the top tabs switch rovers, and the Alerts Manager collects processed warning and critical readings. Each telemetry page has a chart, latest reading, and full change log. Export CSV downloads the selected page's displayed signal. The Rover Fleet button opens a garage overview with model placeholders and links back to each rover's telemetry. Garage repair states and real 3D models are not configured yet.

## Simulated live telemetry

- `src/data/transport-live-stream.json` contains five aligned raw value streams: `battery_level_percent`, `motor_current_amps`, `motor_temperature_c`, `wheel_speed_rpm`, and `joint_status`. It has a `robot_id` and `sample_interval_ms`, but no health labels.
- `src/liveStream.ts` replays those values in sequence, attaches a current UTC timestamp to each combined sample, and loops the source sequence. The frontend appends a sample every two seconds while live mode is selected. The chart shows the most recent 30 samples; the log, alerts, and CSV export retain the full simulated session.
- `src/processing.ts` assigns `good`, `warning`, or `critical` after reading each raw value. Numeric rules use strict `<` and `>` comparisons; joint states use exact enum matches. The rule values live in `src/thresholds.ts`, outside the raw file. Critical takes precedence over warning. These are the same demo thresholds as the original dashboard and `main.py`.
- The top bar button pauses the simulator and shows the original recorded readings. Switching back resumes the simulation. Survey 02 always shows its separate recorded demo data.

This is a browser-side replay of bundled values, not a connection to rover hardware. A real source adapter can later replace `src/liveStream.ts` while keeping raw readings and processing separate. It will need reconnect handling, stale-data indication, and history retention. `main.py` is a separate CSV command-line demo and does not feed the frontend.

## Figma

The [HUNCH Lunar Rover Telemetry Figma file](https://www.figma.com/design/ypX7gCznwRb0RIiraEct9Y) contains editable text and frame layers for the live dashboard, recorded Alerts Manager, and Rover Fleet. These are static design snapshots with raw frames rather than reusable design system components. The `design/rover-dashboard.svg`, `design/alerts-manager.svg`, and `design/rover-fleet.svg` files are separate editable vector handoffs; the dashboard SVG depicts recorded mode. The interactive frontend is in `src/`.

To regenerate the design frames, run `python design/build_figma_frame.py` first, then `python design/build_alerts_frame.py` and `python design/build_fleet_frame.py`.

See `README_Telemetry.md` and `AGENTS.md` for source formats and demo threshold notes.
