import requests
import time

url = "http://localhost:8000/api/datasources/944b5b02-d989-4a43-9499-cc144a3050a7/data"
params = {
    "sort_by": "Date",
    "x_column": "Date",
    "y_column": "Units Sold",
    "group_by": "day",
    "start_date": "2025-10-08",
    "end_date": "2026-01-06",
    "date_column": "Date"
}

try:
    print(f"Sending request to {url} with params {params}")
    response = requests.get(url, params=params)
    print(f"Status Code: {response.status_code}")
    data = response.json()
    rows = data.get('rows', [])
    print(f"Rows returned: {len(rows)}")
    if rows:
        dates = [r['Date'] for r in rows if r.get('Date')]
        if dates:
            print(f"Min Date: {min(dates)}")
            print(f"Max Date: {max(dates)}")

except Exception as e:
    print(f"Request failed: {e}")
