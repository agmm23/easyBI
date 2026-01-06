
import sys
import os
sys.path.append("c:\\$alfonso\\Proyectos\\FlowBI\\easy-bi\\backend")

from app.services.data_processing import get_full_data
import pandas as pd

url = "https://docs.google.com/spreadsheets/d/1xOS1vsswke-ABHJ2O3m_OrHyn8-g4121WodatT1XBt0/edit?usp=sharing"
print(f"Loading data from: {url}")

try:
    df = get_full_data(url)
    print("Columns found:", df.columns.tolist())
    
    if "Date" in df.columns:
        print("'Date' column FOUND.")
        print("First 5 values in 'Date':")
        print(df["Date"].head(5))
        
        # Try conversion
        print("Attempting conversion...")
        dates = pd.to_datetime(df["Date"].astype(str).str.strip(), errors='coerce')
        print("Converted first 5:")
        print(dates.head(5))
        
        print(f"NaT count: {dates.isna().sum()}")
    else:
        print("'Date' column NOT FOUND.")
        
except Exception as e:
    print(f"Error: {e}")
