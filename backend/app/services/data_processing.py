import pandas as pd
import re

def convert_google_sheet_url(url: str) -> str:
    """
    Converts a standard Google Sheet URL to a CSV export URL.
    """
    # Pattern to match /edit... or just the key
    # Example: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?gid=0#gid=0
    # Export: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/export?format=csv&gid=0
    
    # Extract ID
    match = re.search(r'/d/([a-zA-Z0-9-_]+)', url)
    if not match:
        raise ValueError("Invalid Google Sheet URL: Could not extract Sheet ID")
    
    sheet_id = match.group(1)
    
    # Extract GID (Sheet ID within the file) if present
    gid_match = re.search(r'[#&?]gid=([0-9]+)', url)
    gid = gid_match.group(1) if gid_match else "0"
    
    return f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid={gid}"

def process_file(file_path: str):
    """
    Reads the file (CSV, Excel) OR Google Sheets URL and returns a preview of the data.
    """
    try:
        if file_path.startswith('http'):
            # Assume Google Sheet URL for now (or generic CSV url)
            if "docs.google.com" in file_path:
                csv_url = convert_google_sheet_url(file_path)
                df = pd.read_csv(csv_url)
            else:
                 # Check if it ends with csv directly or just try reading
                 df = pd.read_csv(file_path)
        elif file_path.endswith('.csv'):
            df = pd.read_csv(file_path)
        elif file_path.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(file_path)
        else:
            raise ValueError("Unsupported file format")
        
        # Convert NaN to None for JSON serialization
        df = df.where(pd.notnull(df), None)
        
        return {
            "columns": list(df.columns),
            "rows": df.head(5).to_dict(orient='records'),
            "total_rows": len(df)
        }
    except Exception as e:
        raise ValueError(f"Error processing file/url: {str(e)}")

import os
import time

# Global Cache
# Key: file_path (str)
# Value: {
#   'df': DataFrame,
#   'mtime': float (for local files),
#   'timestamp': float (time of load, for TTL)
# }
_DATA_CACHE = {}
CACHE_TTL = 300 # 5 minutes for remote files

def get_full_data(file_path: str, force_refresh: bool = False):
    """
    Reads the entire file (or URL) and returns it as a DataFrame.
    Uses in-memory caching to improve performance.
    """
    global _DATA_CACHE
    
    current_time = time.time()
    is_remote = file_path.startswith('http')
    
    # 1. Check Cache
    if not force_refresh and file_path in _DATA_CACHE:
        entry = _DATA_CACHE[file_path]
        
        if is_remote:
            # TTL Check for Remote Files
            if current_time - entry['timestamp'] < CACHE_TTL:
                return entry['df'].copy()
        else:
            # Modification Time Check for Local Files
            try:
                current_mtime = os.path.getmtime(file_path)
                if current_mtime == entry['mtime']:
                    return entry['df'].copy()
            except OSError:
                pass

    # 2. Load Data (Cache Miss, Expired, or Changed)
    try:
        if is_remote:
            if "docs.google.com" in file_path:
                csv_url = convert_google_sheet_url(file_path)
                df = pd.read_csv(csv_url)
            else:
                df = pd.read_csv(file_path)
        elif file_path.endswith('.csv'):
            df = pd.read_csv(file_path)
        elif file_path.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(file_path)
        else:
            raise ValueError("Unsupported file format")
        
        # 3. Update Cache
        mtime = 0
        if not is_remote:
            try:
                mtime = os.path.getmtime(file_path)
            except OSError:
                pass
                
        _DATA_CACHE[file_path] = {
            'df': df,
            'mtime': mtime,
            'timestamp': current_time
        }
        
        return df.copy()
        
    except Exception as e:
        raise ValueError(f"Error processing file/url: {str(e)}")
