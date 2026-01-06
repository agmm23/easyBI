import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Configuration
start_date = datetime(2023, 1, 1)
end_date = datetime(2024, 12, 31)
date_range = pd.date_range(start=start_date, end=end_date, freq='D')

# Create basic dataframe
df = pd.DataFrame({'Date': date_range})

# Generate realistic-looking data
np.random.seed(42) # For reproducibility

# 1. Sales Volume (Random with some seasonality)
# Base + Random + Seasonality (Higher in Dec/July)
df['Units Sold'] = np.random.randint(50, 200, size=len(df))
df['Units Sold'] = df.apply(lambda row: row['Units Sold'] * 1.5 if row['Date'].month in [7, 12] else row['Units Sold'], axis=1).astype(int)

# 2. Revenue (Units * Price with some variation)
# Assume average price is around $50
df['Revenue'] = df['Units Sold'] * np.random.uniform(45, 55, size=len(df))
df['Revenue'] = df['Revenue'].round(2)

# 3. Categories
categories = ['Electronics', 'Clothing', 'Home', 'Books', 'Toys']
df['Category'] = np.random.choice(categories, size=len(df))

# 4. Region
regions = ['North', 'South', 'East', 'West']
df['Region'] = np.random.choice(regions, size=len(df))

# Export
import os
output_dir = 'test_data_generated'
os.makedirs(output_dir, exist_ok=True)
output_file = os.path.join(output_dir, 'comprehensive_sales_2years.xlsx')
df.to_excel(output_file, index=False)

print(f"Generated {len(df)} rows of data in '{output_file}'")
print(df.head())
