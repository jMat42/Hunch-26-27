# HUNCH lunar telemetry dashboard

Dark-mode frontend for the synthetic Mission 1 telemetry. The transport rover reads the existing JSON records without modifying any source files. Survey 02 is an additional UI demo used to exercise the rover tabs and a different telemetry schema.

## Run

```bash
npm install
npm run dev
```

Build with `npm run build`.

The left sidebar switches telemetry pages, the top tabs switch rovers, and the Alerts Manager collects recorded warning and critical readings. Each telemetry page has a chart, latest reading, and full change log. Export CSV downloads the selected page's displayed signal. This is a recorded session, not a live rover connection.

## Figma

Import `design/rover-dashboard.svg` and `design/alerts-manager.svg` into a Figma design file for editable vector layouts. Their groups, shapes, lines, and text are kept separate. The live frontend is in `src/`; the Figma design frames are handoff artifacts rather than synced source files. The Figma plugin can transfer live screens into a Figma project once connected in Codex.

To regenerate both design frames, run `python design/build_figma_frame.py` followed by `python design/build_alerts_frame.py`.

See `README_Telemetry.md` and `AGENTS.md` for source formats and demo threshold notes.
