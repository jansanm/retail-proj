from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import uvicorn
from ml_engine import DemandPredictor, GeneticOptimizer
from data_loader import DataLoader

app = FastAPI(title="Retail Supply Chain AI")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize modules
data_loader = DataLoader()
predictor = DemandPredictor()
optimizer = GeneticOptimizer()

# --- Models ---
class LoginRequest(BaseModel):
    username: str
    password: str

class AnalysisRequest(BaseModel):
    year: int
    month: int
    holidays: int

class ReorderRequest(BaseModel):
    year: int
    month: int
    category: str
    item: str
    product: str
    holidays: Optional[int] = 0

# --- Endpoints ---

@app.post("/auth/login")
def login(request: LoginRequest):
    if request.username == "admin" and request.password == "admin":
        return {"token": "mock-jwt-token", "user": "admin"}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/analysis/demand")
def analyze_demand(request: AnalysisRequest):
    # Get historical data (aggregate)
    sales_data = data_loader.get_sales_data(request.year, request.month)
    
    # Get all products and calculate metrics for each
    categories = data_loader.get_categories()
    product_analysis = []
    
    for cat in categories:
        products = data_loader.get_products_by_category(cat)
        for prod in products:
            # Predict demand
            predicted = predictor.predict_single_item(prod, request.year, request.month, request.holidays)
            
            # Get stock
            stock = data_loader.get_product_stock(prod, request.year, request.month)
            
            # Get details (price)
            details = data_loader.get_product_details(prod)
            price = details.get("price", 0)
            cost = price * 0.7 # Assumption: 30% margin
            
            # Calculate reorder
            reorder = int(predicted - (stock / 2))
            if reorder < 0: reorder = 0
            
            product_analysis.append({
                "category": cat,
                "product": prod,
                "stock": stock,
                "predicted_demand": predicted,
                "reorder_amount": reorder,
                "price": round(price, 2),
                "cost": round(cost, 2)
            })
            
    return {
        "sales_data": sales_data,
        "product_analysis": product_analysis
    }

@app.post("/supply/reorder")
def calculate_reorder(request: ReorderRequest):
    predicted_demand = predictor.predict_single_item(request.product, request.year, request.month, request.holidays)
    remaining_stock = data_loader.get_product_stock(request.product, request.year, request.month)
    
    reorder_amount = int(predicted_demand - (remaining_stock / 2))
    if reorder_amount < 0:
        reorder_amount = 0
        
    supplier_available = data_loader.check_supplier_availability(request.product, reorder_amount)
    
    return {
        "product": request.product,
        "predicted_demand": predicted_demand,
        "remaining_stock": remaining_stock,
        "reorder_amount": reorder_amount,
        "supplier_available": supplier_available,
        "message": "Order placed successfully" if supplier_available else "Product not available with seller"
    }

class OptimizationRequest(BaseModel):
    product: str
    year: int
    month: int
    holidays: Optional[int] = 0

@app.post("/supply/optimize")
def optimize_supply(request: OptimizationRequest):
    # Predict Demand
    predicted_demand = predictor.predict_single_item(request.product, request.year, request.month, request.holidays)
    
    # Get Current Stock
    current_stock = data_loader.get_product_stock(request.product, request.year, request.month)
    
    # Run Genetic Optimization
    result = optimizer.optimize_supply_chain(request.product, predicted_demand, current_stock)
    
    # Add context
    result["predicted_demand"] = predicted_demand
    result["current_stock"] = current_stock
    
    return result

@app.get("/data/categories")
def get_categories():
    return data_loader.get_categories()

@app.get("/data/products/{category}")
def get_products(category: str):
    return data_loader.get_products_by_category(category)

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
