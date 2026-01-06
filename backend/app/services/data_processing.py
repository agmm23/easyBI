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

def get_full_data(file_path: str):
    """
    Reads the entire file (or URL) and returns it as a DataFrame.
    """
    try:
        if file_path.startswith('http'):
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
        
        return df
    except Exception as e:
        raise ValueError(f"Error processing file/url: {str(e)}")
