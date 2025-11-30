import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Auth from './components/Auth';
import ProductAnalysis from './components/ProductAnalysis';
import ReorderInterface from './components/ReorderInterface';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow p-4">
          <div className="container mx-auto flex justify-between">
            <h1 className="text-xl font-bold text-blue-600">Retail AI</h1>
            <div className="space-x-4">
              <Link to="/analysis" className="text-gray-600 hover:text-blue-600">Analysis</Link>
              <Link to="/reorder" className="text-gray-600 hover:text-blue-600">Reorder</Link>
              <Link to="/" className="text-gray-600 hover:text-blue-600">Login</Link>
            </div>
          </div>
        </nav>

        <div className="container mx-auto mt-8">
          <Routes>
            <Route path="/" element={<Auth />} />
            <Route path="/analysis" element={<ProductAnalysis />} />
            <Route path="/reorder" element={<ReorderInterface />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
