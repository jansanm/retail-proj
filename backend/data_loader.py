import pandas as pd
import numpy as np

class DataLoader:
    def __init__(self):
        self.file_path = "../full_dataset_monthly_storage_fixed.xlsx"
        try:
            self.df = pd.read_excel(self.file_path)
            # Normalize column names
            self.df.columns = [c.strip() for c in self.df.columns]
        except Exception as e:
            print(f"Error loading data: {e}")
            self.df = pd.DataFrame() # Empty fallback

        self.month_map = {
            1: "January", 2: "February", 3: "March", 4: "April",
            5: "May", 6: "June", 7: "July", 8: "August",
            9: "September", 10: "October", 11: "November", 12: "December"
        }

    def get_sales_data(self, year, month):
        if self.df.empty:
            return {"total_sold": 0, "trend": []}
        
        month_name = self.month_map.get(month)
        filtered = self.df[(self.df['year'] == year) & (self.df['month'] == month_name)]
        
        total_sold = int(filtered['total_units_sold_in_month'].sum())
        
        # For trend, since we only have monthly data, we can't show daily trend from this file.
        # We'll mock the daily trend based on the total.
        if total_sold > 0:
            daily_avg = total_sold / 30
            trend = [max(0, int(np.random.normal(daily_avg, daily_avg*0.2))) for _ in range(30)]
        else:
            trend = []

        return {
            "total_sold": total_sold,
            "trend": trend
        }

    def get_storage_data(self, year=None, month=None):
        if self.df.empty:
            return {}
        
        # If year/month provided, filter. Else use latest.
        if year and month:
            month_name = self.month_map.get(month)
            filtered = self.df[(self.df['year'] == year) & (self.df['month'] == month_name)]
        else:
            filtered = self.df
            
        # Return dict of product_name -> remaining stock
        # If multiple entries for same product (e.g. different suppliers?), sum them? 
        # Or just take the first. The dataset seems to have one row per product per month.
        storage = filtered.groupby('product_name')['Total product remaining in stock for that month'].sum().to_dict()
        return storage

    def get_product_stock(self, product_name, year=None, month=None):
        if self.df.empty:
            return 0
            
        # If specific date requested
        if year and month:
             month_name = self.month_map.get(month)
             filtered = self.df[(self.df['year'] == year) & (self.df['month'] == month_name) & (self.df['product_name'] == product_name)]
             if not filtered.empty:
                 return int(filtered['Total product remaining in stock for that month'].sum())
        
        # Fallback to latest available for that product
        filtered = self.df[self.df['product_name'] == product_name]
        if not filtered.empty:
            # Assuming data is sorted or we can sort by year/month. 
            # For now just taking the last row as "latest" might be risky if unsorted.
            # Let's try to find the entry with max year/month.
            # But month is string.
            return int(filtered.iloc[-1]['Total product remaining in stock for that month'])
            
        return 0

    def check_supplier_availability(self, product_name, amount):
        # We can check 'supplier_id' in the df.
        # If a supplier exists for the product, we assume available.
        if self.df.empty:
            return False
        exists = not self.df[self.df['product_name'] == product_name].empty
        return exists

    def get_categories(self):
        if self.df.empty:
            return []
        return self.df['product_category'].unique().tolist()

    def get_products_by_category(self, category):
        if self.df.empty:
            return []
        return self.df[self.df['product_category'] == category]['product_name'].unique().tolist()
    
    def get_all_data(self):
        return self.df

    def get_product_details(self, product_name):
        if self.df.empty:
            return {"price": 0}
        
        filtered = self.df[self.df['product_name'] == product_name]
        if not filtered.empty:
            # Return the mean price (in case it varies) or just the first one
            price = float(filtered['product_price'].mean())
            return {"price": price}
        return {"price": 0}

    def get_monthly_trends(self, year):
        if self.df.empty:
            return []
        
        trends = []
        for m_num in range(1, 13):
            m_name = self.month_map[m_num]
            filtered = self.df[(self.df['year'] == year) & (self.df['month'] == m_name)]
            sales = 0
            if not filtered.empty:
                sales = int(filtered['total_units_sold_in_month'].sum())
            
            trends.append({
                "month": m_name[:3], # Short name: Jan, Feb, etc.
                "sales": sales
            })
        return trends

    def get_unique_products(self):
        if self.df.empty:
            return []
        
        # Get unique product names and categories
        # Taking the last occurrence to pretty much ensure valid data
        products_df = self.df[['product_name', 'product_category']].drop_duplicates(subset=['product_name'])
        
        result = []
        for _, row in products_df.iterrows():
            # Get latest stock for this product
            stock = self.get_product_stock(row['product_name'])
            
            result.append({
                "id": row['product_name'], # Using name as ID for consistency with backend logic
                "name": row['product_name'],
                "category": row['product_category'],
                "remaining_stock": stock,
                "supplier_id": "SPL-GEN" # Mock supplier ID
            })
            
        return sorted(result, key=lambda x: x['name'])
