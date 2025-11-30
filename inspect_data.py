import pandas as pd

file_path = "/Users/quanteondev/Documents/cloud/full_dataset_monthly_storage_fixed.xlsx"

try:
    df = pd.read_excel(file_path)
    print("Columns:", df.columns.tolist())
    print("\nFirst 5 rows:")
    print(df.head().to_string())
    print("\nData Types:")
    print(df.dtypes)
except Exception as e:
    print(f"Error reading file: {e}")
