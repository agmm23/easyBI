import json
import os

CONFIG_FILE = "dashboard_config.json"

if os.path.exists(CONFIG_FILE):
    with open(CONFIG_FILE, 'r') as f:
        data = json.load(f)

    changed = False
    for section in data:
        for chart in section.get("charts", []):
            # Fix: If date_column is missing but x_column matches typical date names, auto-fill it
            if not chart.get("date_column") and chart.get("x_column") in ["Date", "Fecha", "Time"]:
                chart["date_column"] = chart["x_column"]
                changed = True
                print(f"Fixed chart '{chart['title']}': set date_column to {chart['x_column']}")

    if changed:
        with open(CONFIG_FILE, 'w') as f:
            json.dump(data, f, indent=2)
        print("Configuration updated successfully.")
    else:
        print("No changes needed.")
