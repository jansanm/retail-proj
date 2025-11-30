import requests
import json

BASE_URL = "http://localhost:8000"

def test_analysis():
    print("\nTesting Analysis...")
    payload = {"year": 2024, "month": 1, "holidays": 4}
    try:
        response = requests.post(f"{BASE_URL}/analysis/demand", json=payload)
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Sales Data: {data.get('sales_data')}")
        print(f"Product Analysis (First 2 items):")
        print(json.dumps(data.get('product_analysis', [])[:2], indent=2))
    except Exception as e:
        print(f"Analysis failed: {e}")

if __name__ == "__main__":
    test_analysis()
