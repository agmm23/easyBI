import pandas as pd

def process_file(file_path: str):
    """
    Reads the file (CSV or Excel) and returns a preview of the data (columns and first few rows).
    """
    try:
        if file_path.endswith('.csv'):
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
        raise ValueError(f"Error processing file: {str(e)}")

def get_full_data(file_path: str):
    """
    Reads the entire file and returns it as a DataFrame (or list of dicts).
    Using DataFrame is better for subsequent filtering/sorting in the router.
    """
    try:
        if file_path.endswith('.csv'):
            df = pd.read_csv(file_path)
        elif file_path.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(file_path)
        else:
            raise ValueError("Unsupported file format")
        
        return df
    except Exception as e:
        raise ValueError(f"Error processing file: {str(e)}")
