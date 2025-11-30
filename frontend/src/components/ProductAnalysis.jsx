import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const ProductAnalysis = () => {
    const [year, setYear] = useState(2024);
    const [month, setMonth] = useState(1);
    const [holidays, setHolidays] = useState(0);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Fetch data on component mount
    useEffect(() => {
        handleAnalyze();
    }, []);

    const handleAnalyze = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.post('http://localhost:8001/analysis/demand', { 
                year, 
                month, 
                holidays 
            });
            setData(response.data);
        } catch (err) {
            console.error('Error fetching analysis:', err);
            setError('Failed to fetch analysis data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Prepare chart data
    const getChartData = () => {
        if (!data || !data.product_analysis) return null;

        const categories = {};
        data.product_analysis.forEach(item => {
            if (!categories[item.category]) {
                categories[item.category] = 0;
            }
            categories[item.category] += item.predicted_demand;
        });

        return {
            labels: Object.keys(categories),
            datasets: [
                {
                    label: 'Predicted Demand by Category',
                    data: Object.values(categories),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(153, 102, 255, 0.6)',
                    ],
                },
            ],
        };
    };

    const getMonthlyTrendData = () => {
        if (!data || !data.monthly_trends) return null;

        return {
            labels: data.monthly_trends.map(month => month.month),
            datasets: [
                {
                    label: 'Monthly Sales Trend',
                    data: data.monthly_trends.map(month => month.sales),
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.1,
                    fill: true
                },
            ],
        };
    };

    const calculateMetrics = () => {
        if (!data || !data.product_analysis) return null;

        const totalRevenue = data.product_analysis.reduce(
            (sum, item) => sum + (item.predicted_demand * (item.price || 0)), 0
        );

        const totalCost = data.product_analysis.reduce(
            (sum, item) => sum + (item.predicted_demand * (item.cost || 0)), 0
        );

        const profit = totalRevenue - totalCost;
        const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

        return {
            totalRevenue: totalRevenue.toFixed(2),
            totalCost: totalCost.toFixed(2),
            profit: profit.toFixed(2),
            profitMargin: profitMargin.toFixed(2)
        };
    };

    const chartData = getChartData();
    const trendData = getMonthlyTrendData();
    const metrics = calculateMetrics();

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-800">Product Analysis Dashboard</h2>
                    <div className="flex items-center space-x-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                            <select 
                                className="border p-2 rounded-md w-28" 
                                value={year} 
                                onChange={(e) => setYear(parseInt(e.target.value))}
                            >
                                {[2023, 2024, 2025].map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                            <select 
                                className="border p-2 rounded-md w-28" 
                                value={month} 
                                onChange={(e) => setMonth(parseInt(e.target.value))}
                            >
                                {Array.from({length: 12}, (_, i) => i + 1).map(m => {
                                    const date = new Date(2000, m - 1, 1);
                                    return (
                                        <option key={m} value={m}>
                                            {date.toLocaleString('default', { month: 'short' })}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Holidays</label>
                            <input 
                                type="number" 
                                min="0"
                                max="31"
                                className="border p-2 rounded-md w-24"
                                value={holidays} 
                                onChange={(e) => setHolidays(parseInt(e.target.value) || 0)} 
                            />
                        </div>
                        <button 
                            onClick={handleAnalyze}
                            disabled={loading}
                            className={`px-6 py-2 rounded-md text-white font-medium ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} transition-colors`}
                        >
                            {loading ? 'Analyzing...' : 'Analyze'}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
                        <p>{error}</p>
                    </div>
                )}

                {loading && !data ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : data && (
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-gray-500 text-sm font-medium">Total Revenue</h3>
                                <p className="mt-2 text-3xl font-bold text-green-600">${metrics?.totalRevenue || '0'}</p>
                                <p className="text-sm text-gray-500 mt-1">Projected for {new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-gray-500 text-sm font-medium">Total Cost</h3>
                                <p className="mt-2 text-3xl font-bold text-red-600">${metrics?.totalCost || '0'}</p>
                                <p className="text-sm text-gray-500 mt-1">Based on predicted demand</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-gray-500 text-sm font-medium">Projected Profit</h3>
                                <p className={`mt-2 text-3xl font-bold ${metrics?.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ${metrics?.profit || '0'}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">Profit Margin: {metrics?.profitMargin || '0'}%</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-gray-500 text-sm font-medium">Total Units (Predicted)</h3>
                                <p className="mt-2 text-3xl font-bold text-blue-600">
                                    {data.product_analysis.reduce((sum, item) => sum + item.predicted_demand, 0).toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">Across all products</p>
                            </div>
                        </div>

                        {/* Charts Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-lg font-semibold mb-4">Demand by Category</h3>
                                {chartData ? (
                                    <div className="h-80">
                                        <Pie 
                                            data={chartData}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: {
                                                        position: 'right',
                                                    },
                                                    title: {
                                                        display: true,
                                                        text: 'Predicted Demand Distribution'
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-8">No chart data available</p>
                                )}
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-lg font-semibold mb-4">Monthly Sales Trend</h3>
                                {trendData ? (
                                    <div className="h-80">
                                        <Line 
                                            data={trendData}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                scales: {
                                                    y: {
                                                        beginAtZero: true,
                                                        title: {
                                                            display: true,
                                                            text: 'Units Sold'
                                                        }
                                                    },
                                                    x: {
                                                        title: {
                                                            display: true,
                                                            text: 'Month'
                                                        }
                                                    }
                                                },
                                                plugins: {
                                                    legend: {
                                                        display: false
                                                    },
                                                    title: {
                                                        display: true,
                                                        text: '12-Month Sales Trend'
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-8">No trend data available</p>
                                )}
                            </div>
                        </div>

                        {/* Product Analysis Table */}
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="p-6">
                                <h3 className="text-lg font-semibold mb-4">Detailed Product Analysis</h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Predicted Demand</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reorder Amount</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projected Revenue</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {data.product_analysis.map((item, index) => (
                                                <tr key={index} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.product}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.category}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.stock}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.predicted_demand}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                            item.reorder_amount > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                                        }`}>
                                                            {item.reorder_amount > 0 ? `Reorder ${item.reorder_amount} units` : 'Adequate Stock'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        ${item.price ? item.price.toFixed(2) : 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        ${(item.predicted_demand * (item.price || 0)).toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Additional Insights */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-lg font-semibold mb-4">Top Performing Products</h3>
                                <div className="space-y-4">
                                    {[...data.product_analysis]
                                        .sort((a, b) => (b.predicted_demand * (b.price || 0)) - (a.predicted_demand * (a.price || 0)))
                                        .slice(0, 5)
                                        .map((item, index) => (
                                            <div key={index} className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium">{item.product}</p>
                                                    <p className="text-sm text-gray-500">{item.category}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold">${(item.predicted_demand * (item.price || 0)).toFixed(2)}</p>
                                                    <p className="text-sm text-gray-500">{item.predicted_demand} units</p>
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-lg font-semibold mb-4">Stock Alerts</h3>
                                {data.product_analysis.filter(item => item.stock < item.predicted_demand).length > 0 ? (
                                    <div className="space-y-4">
                                        {data.product_analysis
                                            .filter(item => item.stock < item.predicted_demand)
                                            .sort((a, b) => (b.predicted_demand - b.stock) - (a.predicted_demand - a.stock))
                                            .map((item, index) => (
                                                <div key={index} className="bg-red-50 p-3 rounded-md">
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <p className="font-medium text-red-800">{item.product}</p>
                                                            <p className="text-sm text-red-600">
                                                                {item.stock} in stock / {item.predicted_demand} predicted demand
                                                            </p>
                                                        </div>
                                                        <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                                            Reorder {item.predicted_demand - item.stock} units
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        }
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-green-600 font-medium">No stock alerts at this time</p>
                                        <p className="text-sm text-gray-500 mt-1">All products have sufficient stock for predicted demand</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductAnalysis;
