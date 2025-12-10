# Retail Supply Chain AI Dashboard

A full-stack application for analyzing and predicting retail product demand and inventory management.

## Prerequisites

- Python 3.8+
- Node.js 14+
- npm or yarn
- pip (Python package manager)

## Project Structure

```
cloud/
├── backend/           # Python FastAPI backend
├── frontend/          # React frontend
└── full_dataset_monthly_storage_fixed.xlsx  # Sample dataset
```

## Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd /path/to/cloud/backend
   ```

2. Create and activate a Python virtual environment:

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install Python dependencies:

   ```bash
   pip install fastapi uvicorn python-multipart python-jose[cryptography] passlib[bcrypt] python-dotenv openpyxl scikit-learn pandas numpy
   ```

4. Start the backend server:

   ```bash
   uvicorn main:app --reload --port 8001
   ```

   The API will be available at: http://localhost:8001

## Frontend Setup

1. Open a new terminal and navigate to the frontend directory:

   ```bash
   cd /path/to/cloud/frontend
   ```

2. Install Node.js dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm start
   ```

   The application will open automatically in your default browser at: http://localhost:3000

## Accessing the Application

1. Open your web browser and go to: http://localhost:3000
2. Use the following credentials to log in:
   - Username: `admin`
   - Password: `admin`

## API Endpoints

- `POST /auth/login` - User authentication
- `POST /analysis/demand` - Get product demand analysis
- `POST /supply/reorder` - Calculate reorder quantities

## Troubleshooting

1. **Port already in use**: If port 8001 is in use, stop the process using it or change the port in the `uvicorn` command.

2. **Python package installation issues**: Make sure you're using Python 3.8+ and have pip installed.

3. **Frontend not connecting to backend**: Ensure both servers are running and check the API URL in the frontend configuration.

4. **Data loading errors**: Verify that the Excel file exists at the correct path: `cloud/full_dataset_monthly_storage_fixed.xlsx`

## Support

For any issues or questions, please contact the development team.

1.  cd /Users/quanteondev/Documents/cloud/backend
    python3 -m uvicorn main:app --reload --port 8001

2.  curl -X POST http://localhost:8001/analysis/demand -H "Content-Type: application/json" -d '{"year": 2023, "month": 1, "holidays": 0}'

3.  cd /Users/quanteondev/Documents/cloud/frontend
    npm install
    npm start
    ./venv/bin/uvicorn main:app --reload --port 8001

# 1. Navigate to the backend directory

cd backend

# 2. Create a virtual environment (named 'venv')

python3 -m venv venv

# 3. Activate the virtual environment

source venv/bin/activate

# 4. Install the required dependencies

pip install -r requirements.txt

# 5. Run the server

python -m uvicorn main:app --reload --port 8001

curl -X POST http://localhost:8001/supply/optimize \
-H "Content-Type: application/json" \
-d '{"product": "Kellogg’s Corn Flakes", "year": 2023, "month": 1, "holidays": 0}'

1.It Evolves Multiple Solutions Simultaneously Instead of calculating one answer, the AI creates a chaotic "population" of 20 random strategies. Each strategy (individual) has a unique "DNA" consisting of a Reorder Point (when to buy), Safety Stock (how much extra to keep), and Logistics Route (Slow/Cheap vs Fast/Expensive).

2.It Runs a 30-Day Cost Simulation The AI forces each strategy to survive a simulated month. It uses the predicted demand to simulate daily sales, inventory depletion, and restocking delays. If a strategy causes stockouts or holds too much inventory, it incurs a high "financial penalty" (cost).

3.Survival of the Fittest After the simulation, the strategies with the lowest costs are selected as "parents." They mix their parameters (crossover) and slightly mutate their values to create a new, better generation. This process repeats for 10 generations, eventually converging on the mathematical "sweet spot" that minimizes cost while maximizing availability.
