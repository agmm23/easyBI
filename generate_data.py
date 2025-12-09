import pandas as pd
import numpy as np
import os

# Create directory
output_dir = "test_data_generated"
os.makedirs(output_dir, exist_ok=True)

# Generate sample data
np.random.seed(42)
dates = pd.date_range(start='2024-01-01', periods=12, freq='M')
products = ['Laptop', 'Mouse', 'Keyboard', 'Monitor', 'Headphones']
regions = ['North', 'South', 'East', 'West']

data = []
for _ in range(100):
    data.append({
        'Date': np.random.choice(dates),
        'Product': np.random.choice(products),
        'Region': np.random.choice(regions),
        'Units Sold': np.random.randint(1, 50),
        'Unit Price': np.random.randint(20, 2000),
    })

df = pd.DataFrame(data)
df['Total Revenue'] = df['Units Sold'] * df['Unit Price']
df['Date'] = df['Date'].dt.strftime('%Y-%m-%d')

# Save to Excel
output_path = os.path.join(output_dir, "sales_data.xlsx")
df.to_excel(output_path, index=False)

print(f"File created at: {os.path.abspath(output_path)}")
