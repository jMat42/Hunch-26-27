"""Build the editable Rover Fleet garage frame from the shared dashboard shell."""
from pathlib import Path
import xml.etree.ElementTree as ET
from palette import recolor

SVG = "http://www.w3.org/2000/svg"
ET.register_namespace("", SVG)
tag = lambda name: f"{{{SVG}}}{name}"
root = ET.parse(Path(__file__).with_name("rover-dashboard.svg")).getroot()
groups = {group.get("id"): group for group in root if group.tag == tag("g")}

side = groups["01-sidebar"]
for element in side:
    if element.tag == tag("rect") and element.get("x") == "10" and element.get("y") == "211":
        element.set("fill", "#0c0e12")
        element.set("stroke", "none")
    if element.tag == tag("text") and element.text == "Battery Level":
        element.set("fill", "#9bafc3")

topbar = groups["02-topbar-and-rover-tabs"]
topbar.insert(3, ET.Element(tag("rect"), {"x": "225", "y": "0", "width": "178", "height": "68", "fill": "#171e28"}))
topbar.insert(4, ET.Element(tag("rect"), {"x": "225", "y": "66", "width": "178", "height": "2", "fill": "#69aaff"}))

for name in ["03-main-heading-and-summary", "04-signal-history-chart", "05-telemetry-log", "06-alerts-rail"]:
    root.remove(groups[name])

main = ET.Element(tag("g"), {"id": "03-rover-fleet-garage"})


def rect(x, y, width, height, fill, stroke="none", radius=0):
    ET.SubElement(main, tag("rect"), {"x": str(x), "y": str(y), "width": str(width), "height": str(height), "rx": str(radius), "fill": fill, "stroke": stroke})


def text(x, y, value, size=12, color="#eaf2ff", weight=500, mono=False, anchor="start", spacing=None):
    props = {"x": str(x), "y": str(y), "fill": color, "font-family": "IBM Plex Mono, Consolas, monospace" if mono else "DM Sans, Arial, sans-serif", "font-size": str(size), "font-weight": str(weight), "text-anchor": anchor}
    if spacing is not None:
        props["letter-spacing"] = str(spacing)
    ET.SubElement(main, tag("text"), props).text = value


def line(x1, y1, x2, y2, color="#252b34", width=1, dash=None):
    props = {"x1": str(x1), "y1": str(y1), "x2": str(x2), "y2": str(y2), "stroke": color, "stroke-width": str(width)}
    if dash:
        props["stroke-dasharray"] = dash
    ET.SubElement(main, tag("line"), props)


def circle(x, y, radius, fill, stroke="none", width=1):
    ET.SubElement(main, tag("circle"), {"cx": str(x), "cy": str(y), "r": str(radius), "fill": fill, "stroke": stroke, "stroke-width": str(width)})


def path(d, fill="none", stroke="none", width=1, dash=None):
    props = {"d": d, "fill": fill, "stroke": stroke, "stroke-width": str(width)}
    if dash:
        props["stroke-dasharray"] = dash
    ET.SubElement(main, tag("path"), props)


line(254, 99, 271, 99, "#69aaff")
text(280, 103, "LUNAR OPERATIONS  /  GARAGE", 9, "#84a4c0", 600, mono=True, spacing=1)
text(254, 140, "Rover Fleet", 30, weight=700)
text(254, 163, "Vehicle overview and telemetry entry point", 11, "#89a0b8")
rect(1300, 117, 110, 30, "#151b23", "#303b48", 4)
text(1355, 137, "2 VEHICLES", 9, "#a5bed6", 600, mono=True, anchor="middle")

rect(254, 185, 1156, 59, "#14191f", "#2b3949", 8)
circle(281, 214, 9, "none", "#83b6e5")
text(303, 208, "Garage workspace", 12, weight=700)
text(303, 227, "Vehicle models and repair tracking will live here. Current cards show recorded telemetry only.", 10, "#8d9fb1")

cards = [
    (254, "01", "Transport 01", "P2-TRANSPORT-01", "Cargo transport rover", "5 signals · 6 samples", "Critical", "#ff8490", "#45252f", "#9b3e4e"),
    (840, "02", "Survey 02", "P2-SURVEY-02", "Surface survey rover", "4 signals · 6 samples", "Warning", "#ffd17c", "#423522", "#8e6834"),
]
for x, number, name, rid, role, telemetry, severity, color, badge_fill, badge_stroke in cards:
    rect(x, 262, 570, 526, "#11151b", "#29323c", 9)
    text(x + 20, 290, "ROVER " + number, 9, "#829bb2", 600, mono=True, spacing=1)
    text(x + 20, 323, name, 21, weight=700)
    text(x + 20, 343, rid, 10, "#8299ae", mono=True)
    rect(x + 473, 281, 77, 24, badge_fill, badge_stroke, 3)
    circle(x + 485, 293, 3, color)
    text(x + 494, 296, severity, 9, color, 600, mono=True)
    rect(x + 14, 364, 542, 250, "#151b23", "#293643", 7)
    for step in range(1, 20):
        line(x + 14 + step * 28, 365, x + 14 + step * 28, 614, "#21303e")
    for step in range(1, 9):
        line(x + 14, 364 + step * 28, x + 556, 364 + step * 28, "#21303e")
    rover_x = x + 70
    path(f"M{rover_x+20} 477 L{rover_x+45} 452 L{rover_x+313} 452 L{rover_x+338} 477 L{rover_x+326} 548 L{rover_x+34} 548 Z", "#1a2632", "#7799b5", 2)
    path(f"M{rover_x+29} 478 L{rover_x+328} 478 M{rover_x+97} 452 L{rover_x+115} 478 M{rover_x+262} 452 L{rover_x+243} 478", stroke="#496d8d")
    path(f"M{rover_x+80} 452 L{rover_x+99} 430 L{rover_x+255} 430 L{rover_x+275} 452 M{rover_x+167} 430 L{rover_x+167} 404 L{rover_x+192} 404", stroke="#8badc9", width=2)
    circle(rover_x + 210, 414, 9, "#101820", "#8badc9", 2)
    for cx in [rover_x + 40, rover_x + 119, rover_x + 250, rover_x + 329]:
        circle(cx, 565, 20, "#101820", "#8badc9", 2)
        circle(cx, 565, 8, "#283d50", "#688bab")
    text(x + 24, 599, "3D MODEL SLOT  ·  CONCEPT PREVIEW", 9, "#9eb8cd", 600, mono=True, spacing=.8)
    text(x + 20, 644, "ROLE", 9, "#7690a8", 600, mono=True)
    text(x + 20, 663, role, 11, "#d1dce7", 700)
    text(x + 209, 644, "TELEMETRY", 9, "#7690a8", 600, mono=True)
    text(x + 209, 663, telemetry, 11, "#d1dce7", 700)
    text(x + 416, 644, "GARAGE STATE", 9, "#7690a8", 600, mono=True)
    text(x + 416, 663, "Not configured", 11, "#d1dce7", 700)
    rect(x + 20, 688, 530, 41, "#1a2735", "#3a526a", 5)
    text(x + 34, 714, "Open telemetry", 11, "#c6dff6", 700)
    text(x + 535, 714, "→", 16, "#c6dff6", anchor="end")

root.insert(3, main)
out = Path(__file__).with_name("rover-fleet.svg")
out.write_text(recolor(ET.tostring(root, encoding="unicode", xml_declaration=True)), encoding="utf-8")
print(out)
