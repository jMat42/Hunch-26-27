"""Build an editable Alerts Manager SVG from the shared dashboard frame."""
from pathlib import Path
import xml.etree.ElementTree as ET

SVG = "http://www.w3.org/2000/svg"
ET.register_namespace("", SVG)


def tag(name):
    return f"{{{SVG}}}{name}"


root = ET.parse(Path(__file__).with_name("rover-dashboard.svg")).getroot()
groups = {group.get("id"): group for group in root if group.tag == tag("g")}
side = groups["01-sidebar"]

# Make Alerts Manager the active sidebar item.
for element in side:
    if element.tag == tag("rect") and element.get("x") == "10" and element.get("y") == "211":
        element.set("fill", "#0a1522")
        element.set("stroke", "none")
    if element.tag == tag("text") and element.text == "Battery Level":
        element.set("fill", "#9bafc3")
    if element.tag == tag("text") and element.text == "Alerts Manager":
        element.set("fill", "#eaf4ff")

alert_text = next(i for i, element in enumerate(side) if element.tag == tag("text") and element.text == "Alerts Manager")
side.insert(alert_text - 1, ET.Element(tag("rect"), {"x": "10", "y": "490", "width": "205", "height": "40", "rx": "6", "fill": "#173354", "stroke": "#31547a"}))
side.insert(alert_text, ET.Element(tag("rect"), {"x": "10", "y": "490", "width": "3", "height": "40", "fill": "#70b3ff"}))

for name in ["03-main-heading-and-summary", "04-signal-history-chart", "05-telemetry-log"]:
    root.remove(groups[name])

main = ET.Element(tag("g"), {"id": "03-alerts-manager-page"})


def rect(x, y, w, h, fill, stroke="none", radius=0):
    ET.SubElement(main, tag("rect"), {"x": str(x), "y": str(y), "width": str(w), "height": str(h), "rx": str(radius), "fill": fill, "stroke": stroke})


def text(x, y, value, size=12, color="#eaf2ff", weight=500, mono=False, anchor="start", spacing=None):
    attributes = {"x": str(x), "y": str(y), "fill": color, "font-family": "IBM Plex Mono, Consolas, monospace" if mono else "DM Sans, Arial, sans-serif", "font-size": str(size), "font-weight": str(weight), "text-anchor": anchor}
    if spacing is not None:
        attributes["letter-spacing"] = str(spacing)
    ET.SubElement(main, tag("text"), attributes).text = value


def line(x1, y1, x2, y2, color="#20354a"):
    ET.SubElement(main, tag("line"), {"x1": str(x1), "y1": str(y1), "x2": str(x2), "y2": str(y2), "stroke": color})


def circle(x, y, radius, fill):
    ET.SubElement(main, tag("circle"), {"cx": str(x), "cy": str(y), "r": str(radius), "fill": fill})


line(256, 95, 272, 95, "#69aaff")
text(256, 105, "SYSTEM  /  P2-TRANSPORT-01", 9, "#84a4c0", 600, mono=True, spacing=1)
text(256, 141, "Alerts Manager", 29, weight=700)
text(256, 162, "Out of range readings across all telemetry sources · Demo thresholds", 11, "#89a0b8")

stats = [
    (254, "01", "Critical events", "#ff6878", "#422530"),
    (502, "03", "Warnings", "#f5bf5f", "#3e3525"),
    (750, "02", "Nominal signals now", "#39d795", "#183e37"),
]
for x, number, label, color, icon_fill in stats:
    rect(x, 184, 235, 104, "#102136", "#20354a", 8)
    rect(x + 17, 209, 40, 40, icon_fill, radius=7)
    circle(x + 37, 229, 7, color)
    text(x + 72, 230, number, 25, weight=600, mono=True)
    text(x + 72, 250, label, 10, "#8da6be")

rect(254, 305, 731, 515, "#0c1b2a", "#20354a", 8)
line(254, 373, 985, 373)
text(274, 329, "ALERT FEED", 9, "#6f92af", 600, mono=True, spacing=1)
text(274, 352, "Recorded events", 15, weight=700)
rect(751, 323, 214, 33, "#091a2a", "#20354a", 5)
rect(755, 327, 50, 25, "#1b4162", radius=3)
text(780, 344, "All", 9, "#c8e4ff", 700, anchor="middle")
text(846, 344, "Critical", 9, "#89a4bb", 700, anchor="middle")
text(924, 344, "Warning", 9, "#89a4bb", 700, anchor="middle")

events = [
    ("Motor Current", "4.5 A", "motor_current_amps", "Critical", "#ff6878", "#45252f", "#9b3e4e", "14:25:00"),
    ("Motor Temperature", "64.0 °C", "motor_temperature_c", "Warning", "#f5bf5f", "#423522", "#8e6834", "14:25:00"),
    ("Joint Status", "LIMITED", "joint_status", "Warning", "#f5bf5f", "#423522", "#8e6834", "14:25:00"),
    ("Motor Current", "3.7 A", "motor_current_amps", "Warning", "#f5bf5f", "#423522", "#8e6834", "14:20:00"),
]
for i, (name, value, key, status, color, badge_fill, badge_stroke, time) in enumerate(events):
    y = 388 + i * 100
    rect(269, y, 701, 90, "#102238", "#38506a", 6)
    rect(269, y, 3, 90, color)
    circle(293, y + 23, 8, color)
    text(310, y + 27, name, 12, weight=700)
    badge_width = 71 if status == "Warning" else 67
    rect(425, y + 12, badge_width, 22, badge_fill, badge_stroke, 3)
    circle(436, y + 23, 3, color)
    text(445, y + 26, status, 9, color, 600, mono=True)
    text(310, y + 51, value + " · " + key, 10, "#a9c0d7", mono=True)
    text(310, y + 72, time + " UTC · 11 OCT 2026", 9, "#6f8ca6", mono=True)
    rect(864, y + 31, 89, 28, "#16334e", "#345a79", 4)
    text(908, y + 49, "Acknowledge", 9, "#add3f4", anchor="middle")

text(257, 843, "ⓘ  Thresholds are demonstration choices from main.py, not mission flight limits.", 10, "#7794ad")

root.insert(3, main)
out = Path(__file__).with_name("alerts-manager.svg")
ET.ElementTree(root).write(out, encoding="unicode", xml_declaration=True)
print(out)
