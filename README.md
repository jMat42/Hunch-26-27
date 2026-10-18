# HUNCH lunar telemetry dashboard

Dark-mode frontend for the synthetic Mission 1 telemetry. The transport rover reads the existing JSON records without modifying any source files. Survey 02 is an additional UI demo used to exercise the rover tabs and a different telemetry schema.

## Run

```bash
npm install
npm run dev
```

Build with `npm run build`.

The left sidebar switches telemetry pages, the top tabs switch rovers, and the Alerts Manager collects recorded warning and critical readings. Each telemetry page has a chart, latest reading, and full change log. Export CSV downloads the selected page's displayed signal. The Rover Fleet button opens a garage overview with model placeholders and links back to each rover's telemetry. Garage repair states and real 3D models are not configured yet.

## Why the readings do not update live

- `src/telemetry.ts` imports two bundled JSON files at build time. Both contain six fixed readings dated 11 October 2026.
- The frontend has no telemetry API, WebSocket, server-sent event stream, or polling loop. Its React state only changes the selected rover, page, and local alert acknowledgments.
- `main.py` reads a CSV file for a command-line demonstration; it does not serve data to this frontend. Its current `data/simulated_mission1_telemetry.csv` path also does not match the CSV's location in this repo.

To go live later, add a source adapter that ingests timestamped samples per `robot_id`, updates the frontend record state, and handles reconnects, stale-data warnings, and history retention. Do not append artificial samples to the original Mission 1 files.

## Figma

Import `design/rover-dashboard.svg`, `design/alerts-manager.svg`, and `design/rover-fleet.svg` into a Figma design file for editable vector layouts. Their groups, shapes, lines, and text are kept separate. The live frontend is in `src/`; the SVG frames are handoff artifacts rather than synced source files.

To regenerate the design frames, run `python design/build_figma_frame.py` first, then `python design/build_alerts_frame.py` and `python design/build_fleet_frame.py`.

See `README_Telemetry.md` and `AGENTS.md` for source formats and demo threshold notes.
