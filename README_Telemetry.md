# Simulated Mission 1 telemetry

This folder contains six synthetic records for `P2-TRANSPORT-01`. They cover the HUNCH Mission 1 examples: battery level, motor current, motor temperature, wheel speed, and joint status. The later rows deliberately trend toward a concerning condition, making the same set useful when Mission 2 begins.

## Files

- `simulated_mission1_telemetry.json` and `.csv`: readable copies for checking values and importing into simple tools.
- `simulated_mission1_telemetry.parquet`: columnar analysis/storage copy.
- `simulated_mission1_telemetry.h5`: HDF5 scientific-data copy; datasets are under `/telemetry`.
- `llaso_p4_demo.xtce.xml`: minimal XTCE-style parameter definitions for the demo fields.
- `simulated_mission1_ccsds_packets.bin`: six concatenated CCSDS-style telemetry packets. Each packet has a 6-byte primary header followed by this big-endian demo payload: timestamp (uint64 milliseconds), four float32 measurements, and joint-status (uint8).

## Important limits

The telemetry readings, APID, packet layout, XTCE document, and any future health thresholds are PDR demonstration choices—not NASA-provided flight requirements or a complete CCSDS/XTCE implementation. Keep threshold rules in a separate configuration file when you write Mission 1.
