"""Generate the editable SVG design frame from simple named vector layers."""
from html import escape
from pathlib import Path

OUT = Path(__file__).with_name("rover-dashboard.svg")
parts = ['<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="900" viewBox="0 0 1440 900" role="img" aria-label="HUNCH lunar telemetry dashboard design frame">']


def group(name):
    parts.append(f'<g id="{name}">')


def end():
    parts.append('</g>')


def rect(x, y, w, h, fill, stroke="none", rx=0, sw=1):
    parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>')


def text(x, y, value, size=12, color="#eaf2ff", weight=500, mono=False, anchor="start", spacing=None):
    family = "IBM Plex Mono, Consolas, monospace" if mono else "DM Sans, Arial, sans-serif"
    extra = f' letter-spacing="{spacing}"' if spacing is not None else ""
    parts.append(f'<text x="{x}" y="{y}" fill="{color}" font-family="{family}" font-size="{size}" font-weight="{weight}" text-anchor="{anchor}"{extra}>{escape(value)}</text>')


def circle(x, y, r, fill, stroke="none"):
    parts.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}" stroke="{stroke}"/>')


def line(x1, y1, x2, y2, stroke="#20354a", width=1, dash=None):
    extra = f' stroke-dasharray="{dash}"' if dash else ""
    parts.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{stroke}" stroke-width="{width}"{extra}/>')


group("00-background")
rect(0, 0, 1440, 900, "#07111d")
end()

group("01-sidebar")
rect(0, 0, 225, 900, "#0a1522")
line(224, 0, 224, 900)
line(0, 68, 225, 68)
rect(17, 18, 31, 31, "#112b45", "#416b91", 9)
text(32, 39, "◐", 19, "#8fc2ff", anchor="middle")
text(60, 35, "HUNCH / GS", 15, weight=700)
text(60, 49, "LUNAR TELEMETRY", 8, "#7f95ad", mono=True, spacing=1.3)
text(19, 94, "WORKSPACE", 9, "#7890a8", mono=True, weight=600, spacing=1.2)
rect(12, 105, 201, 48, "#102035", "#20354a", 7)
rect(21, 114, 30, 30, "#1c4674", rx=5)
text(36, 134, "M1", 9, "#add5ff", mono=True, weight=600, anchor="middle")
text(60, 126, "Mission Control", 11, weight=700)
text(60, 141, "Surface operations", 9, "#7f95ad")
line(16, 175, 209, 175)
text(19, 198, "TELEMETRY PAGES", 9, "#7890a8", mono=True, weight=600, spacing=1)
text(204, 198, "05", 9, "#597188", mono=True, anchor="end")
pages = [
    ("Battery Level", "#39d795"),
    ("Motor Current", "#ff6878"),
    ("Motor Temperature", "#f5bf5f"),
    ("Wheel Speed", "#39d795"),
    ("Joint Status", "#f5bf5f"),
]
for i, (name, status) in enumerate(pages):
    y = 211 + i * 46
    if i == 0:
        rect(10, y, 205, 40, "#173354", "#31547a", 6)
        rect(10, y, 3, 40, "#70b3ff")
    circle(30, y + 20, 8, "none", "#8ec3ff" if i == 0 else "#7d96b0")
    line(26, y + 20, 34, y + 20, "#8ec3ff" if i == 0 else "#7d96b0")
    text(48, y + 24, name, 11, "#eaf4ff" if i == 0 else "#9bafc3", 600)
    circle(197, y + 20, 3, status)
line(16, 456, 209, 456)
text(19, 480, "SYSTEM", 9, "#7890a8", mono=True, weight=600, spacing=1)
text(48, 515, "Alerts Manager", 11, "#9bafc3", 600)
circle(30, 511, 7, "none", "#7d96b0")
rect(182, 501, 24, 18, "#522b37", rx=9)
text(194, 514, "3", 9, "#ff9ca5", mono=True, weight=600, anchor="middle")
rect(12, 811, 201, 50, "#0f2032", "#20354a", 7)
circle(34, 835, 11, "#153b58")
text(34, 839, "◉", 12, "#76b5ff", anchor="middle")
text(54, 831, "Recorded telemetry", 10, weight=700)
text(54, 847, "Demo session · 11 Oct 2026", 8, "#7f95ad")
line(0, 869, 225, 869)
circle(20, 885, 4, "#39d795")
text(31, 888, "SOURCE READY", 9, "#7f95ad", mono=True, weight=600, spacing=.7)
end()

group("02-topbar-and-rover-tabs")
rect(225, 0, 1215, 68, "#0a1725")
line(225, 67, 1440, 67)
line(403, 0, 403, 68)
text(248, 39, "◉", 18, "#82b8fa")
text(274, 39, "ROVER FLEET", 10, "#abc1d8", mono=True, weight=600, spacing=1.3)
rect(409, 0, 177, 68, "#102b47")
rect(409, 66, 177, 2, "#69aaff")
circle(424, 29, 4, "#69aaff")
text(437, 30, "Transport 01", 12, weight=700)
text(437, 46, "P2-TRANSPORT-01", 8, "#8faecb", mono=True)
circle(603, 29, 4, "#57738f")
text(616, 30, "Survey 02", 12, "#8198ae", 700)
text(616, 46, "P2-SURVEY-02", 8, "#617a93", mono=True)
rect(1150, 21, 122, 27, "#112945", "#254b71", 4)
circle(1161, 34, 3, "#69aaff")
text(1170, 38, "RECORDED SESSION", 8, "#75aaec", mono=True, weight=600)
text(1420, 38, "11 OCT 2026", 9, "#8095ab", mono=True, anchor="end")
end()

group("03-main-heading-and-summary")
text(256, 105, "POWER SYSTEM  /  P2-TRANSPORT-01", 9, "#84a4c0", mono=True, weight=600, spacing=1)
line(256, 95, 272, 95, "#69aaff")
text(256, 141, "Battery Level", 29, weight=700)
text(256, 162, "Remaining battery charge · Mission 1 source data", 11, "#89a0b8")
rect(876, 118, 109, 33, "#10263b", "#325472", 5)
text(931, 138, "↓  Export CSV", 10, "#c7dff7", 700, anchor="middle")
rect(254, 184, 235, 130, "#163859", "#315777", 8)
rect(502, 184, 235, 130, "#102238", "#20354a", 8)
rect(750, 184, 235, 130, "#102238", "#20354a", 8)
text(273, 208, "LATEST READING", 9, "#84a4c0", mono=True, weight=600, spacing=1)
text(273, 259, "78", 39, mono=True, weight=600)
text(326, 258, "%", 15, "#92aec9", mono=True)
rect(273, 275, 68, 22, "#123b35", "#2d7760", 3)
circle(283, 286, 3, "#63e6ab")
text(292, 289, "Nominal", 8, "#63e6ab", mono=True, weight=600)
text(350, 289, "at 14:25:00 UTC", 9, "#8fa7be", mono=True)
text(521, 208, "CHANGE FROM PREVIOUS", 9, "#84a4c0", mono=True, weight=600, spacing=1)
text(521, 260, "↘ 2 %", 26, mono=True, weight=600)
text(521, 290, "5 minute sample interval", 10, "#8198af")
text(769, 208, "OBSERVED RANGE", 9, "#84a4c0", mono=True, weight=600, spacing=1)
text(769, 260, "78–86 %", 26, mono=True, weight=600)
text(769, 290, "Across 6 recorded samples", 10, "#8198af")
end()

group("04-signal-history-chart")
rect(254, 328, 731, 276, "#0c1b2a", "#20354a", 8)
line(254, 385, 985, 385)
text(274, 349, "SIGNAL HISTORY", 9, "#6f92af", mono=True, weight=600, spacing=1)
text(274, 371, "Battery Level over time", 15, weight=700)
rect(850, 345, 115, 27, "#10263b", "#2c4a64", 4)
circle(861, 358, 3, "#69aaff")
text(870, 362, "Recorded · 25 min", 9, "#9fb7cd", mono=True)
chart_x = [311, 435, 559, 683, 807, 931]
chart_y = [428, 440, 452, 476, 500, 524]
for yy, label in [(418, "88"), (456, "84"), (494, "80"), (532, "76")]:
    line(311, yy, 944, yy, "#274057", dash="4 5")
    text(299, yy + 4, label, 9, "#7791a9", mono=True, anchor="end")
parts.append('<path d="M311 428 L435 440 L559 452 L683 476 L807 500 L931 524 L931 548 L311 548 Z" fill="#204c74" opacity="0.35"/>')
parts.append('<path d="M311 428 L435 440 L559 452 L683 476 L807 500 L931 524" fill="none" stroke="#69aaff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>')
for xx, yy in zip(chart_x, chart_y):
    circle(xx, yy, 7, "#122b41", "#5785ad")
    circle(xx, yy, 4, "#39d795", "#0b1b29")
text(311, 571, "14:00", 9, "#7791a9", mono=True)
text(621, 571, "14:10", 9, "#7791a9", mono=True, anchor="middle")
text(944, 571, "14:25", 9, "#7791a9", mono=True, anchor="end")
line(254, 580, 985, 580)
line(275, 592, 291, 592, "#69aaff", 2)
text(298, 596, "Measured value", 9, "#8aa2b9", mono=True)
circle(418, 592, 3, "#39d795")
text(426, 596, "Nominal", 9, "#8aa2b9", mono=True)
circle(505, 592, 3, "#f5bf5f")
text(513, 596, "Warning", 9, "#8aa2b9", mono=True)
circle(593, 592, 3, "#ff6878")
text(601, 596, "Critical", 9, "#8aa2b9", mono=True)
end()

group("05-telemetry-log")
rect(254, 620, 731, 233, "#0c1b2a", "#20354a", 8)
text(274, 641, "EVENT STREAM", 9, "#6f92af", mono=True, weight=600, spacing=1)
text(274, 663, "Telemetry log", 15, weight=700)
rect(904, 640, 60, 22, "#10283d", rx=3)
text(934, 655, "6 RECORDS", 8, "#87b5df", mono=True, anchor="middle")
rect(255, 675, 729, 31, "#102237")
for x, value in [(274, "TIME (UTC)"), (420, "PARAMETER"), (675, "READING"), (770, "CHANGE"), (866, "STATUS")]:
    text(x, 695, value, 8, "#7290aa", mono=True, weight=600, spacing=.7)
for i, (tm, value) in enumerate([("14:25:00", "78"), ("14:20:00", "80"), ("14:15:00", "82")]):
    y = 707 + i * 48
    line(255, y, 984, y, "#193044")
    text(274, y + 29, tm, 10, "#afc5dc", mono=True)
    text(420, y + 29, "battery_level_percent", 10, "#83afe1", mono=True)
    text(675, y + 29, value + " %", 10, "#c7d8eb", mono=True, weight=600)
    text(770, y + 29, "-2", 10, "#90a9c0", mono=True)
    rect(866, y + 12, 71, 21, "#123b35", "#2d7760", 3)
    circle(876, y + 22, 3, "#63e6ab")
    text(885, y + 25, "Nominal", 8, "#63e6ab", mono=True, weight=600)
end()

group("06-alerts-rail")
rect(1000, 68, 440, 801, "#0a1827")
line(1000, 68, 1000, 869)
text(1022, 98, "MISSION CONTROL", 9, "#7192b1", mono=True, weight=600, spacing=1)
text(1022, 121, "System status", 16, weight=700)
rect(1373, 86, 38, 38, "#13324e", "#2b5578", 8)
text(1392, 111, "⌾", 23, "#7cb6ee", anchor="middle")
rect(1022, 142, 390, 104, "#163654", "#2b5475", 7)
circle(1042, 164, 4, "#f5bf5f")
text(1054, 168, "ATTENTION REQUIRED", 9, "#94bfe7", mono=True, weight=600, spacing=.7)
text(1040, 204, "3 signals flagged", 19, weight=700)
text(1040, 226, "Latest recorded sample · 14:25:00 UTC", 10, "#91aabe")
text(1022, 274, "ACTIVE CONDITIONS", 9, "#839db5", mono=True, weight=600, spacing=1)
text(1412, 274, "03", 9, "#7899b5", mono=True, anchor="end")
alerts = [
    ("Motor Current", "4.5 A", "motor_current_amps", "Critical", "#2a1e2b", "#70414d", "#ff8490"),
    ("Motor Temperature", "64.0 °C", "motor_temperature_c", "Warning", "#2b291f", "#665435", "#ffd17c"),
    ("Joint Status", "LIMITED", "joint_status", "Warning", "#2b291f", "#665435", "#ffd17c"),
]
for i, (name, value, key, status, fill, stroke, color) in enumerate(alerts):
    y = 289 + i * 103
    rect(1022, y, 390, 94, fill, stroke, 7)
    text(1035, y + 22, name, 11, weight=700)
    circle(1341, y + 18, 3, color)
    text(1400, y + 22, status, 9, color, mono=True, weight=600, anchor="end")
    text(1035, y + 52, value, 19, mono=True, weight=600)
    text(1035, y + 75, key, 9, "#8f9eaa", mono=True)
rect(1022, 610, 390, 34, "#142e48", "#365a79", 5)
text(1034, 631, "Open Alerts Manager", 10, "#9dccf7", weight=700)
text(1398, 632, "→", 16, "#9dccf7", anchor="end")
line(1022, 667, 1412, 667)
text(1022, 691, "RECENT ACTIVITY", 9, "#839db5", mono=True, weight=600, spacing=1)
for i, (name, detail, color) in enumerate([("Motor current", "4.5 A · Critical", "#ff6878"), ("Motor temp", "64.0 °C · Warning", "#f5bf5f"), ("Joint status", "LIMITED · Warning", "#f5bf5f")]):
    y = 712 + i * 45
    circle(1028, y + 8, 3, color)
    text(1040, y + 10, name, 10, weight=700)
    text(1040, y + 25, detail, 9, "#859db4")
    text(1398, y + 10, "14:25", 9, "#718ba4", mono=True, anchor="end")
end()

group("07-statusbar")
rect(225, 869, 1215, 31, "#091624")
line(225, 869, 1440, 869)
circle(245, 885, 3, "#39d795")
text(254, 888, "Dataset loaded / 6 samples / P2-TRANSPORT-01", 9, "#93acbf", mono=True)
text(1420, 888, "UTC  /  HUNCH 26–27", 9, "#93acbf", mono=True, anchor="end")
end()

parts.append('</svg>')
OUT.write_text('\n'.join(parts), encoding='utf-8')
print(OUT)
