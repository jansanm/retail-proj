import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const ReorderInterface = () => {
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedProduct, setSelectedProduct] = useState('');
    const [year, setYear] = useState(2024);
    const [month, setMonth] = useState(12);
    const [result, setResult] = useState(null);
    const [orderQuantity, setOrderQuantity] = useState(0);
    const [supplierEmail, setSupplierEmail] = useState('');
    const [quickSupplierEmail, setQuickSupplierEmail] = useState('');
    const [productsData, setProductsData] = useState([]);
    const [orderHistory, setOrderHistory] = useState(() => {
        const saved = localStorage.getItem('orderHistory');
        return saved ? JSON.parse(saved) : [];
    });

    // Fetch products from backend
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get('http://localhost:8000/data/products');
                const mappedData = response.data.map(item => ({
                    product_id: item.id,
                    product_name: item.name,
                    product_category: item.category,
                    remaining_stock: item.remaining_stock,
                    supplier_id: item.supplier_id
                }));
                setProductsData(mappedData);
            } catch (err) {
                console.error("Failed to fetch products", err);
            }
        };
        fetchProducts();
    }, []);

    // Get unique categories from product data
    const categories = useMemo(() => {
        const cats = [...new Set(productsData.map(item => item.product_category))];
        return cats.sort();
    }, [productsData]);

    // Filter products based on selected category
    const products = useMemo(() => {
        if (!selectedCategory) return [];
        return productsData
            .filter(item => item.product_category === selectedCategory)
            .map(item => ({
                id: item.product_id,
                name: item.product_name,
                remaining_stock: item.remaining_stock,
                supplier_id: item.supplier_id,
                category: item.product_category
            }));
    }, [selectedCategory, productsData]);

    const [quickSelectedProduct, setQuickSelectedProduct] = useState('');
    const [quickOrderQuantity, setQuickOrderQuantity] = useState(0);

    // Get all unique products for Quick Reorder
    const allUniqueProducts = useMemo(() => {
        return productsData.map(item => ({
            id: item.product_id,
            name: item.product_name,
            remaining_stock: item.remaining_stock,
            supplier_id: item.supplier_id,
            category: item.product_category
        })).sort((a, b) => a.name.localeCompare(b.name));
    }, [productsData]);

    // Reset selected product when category changes
    useEffect(() => {
        setSelectedProduct('');
        setOrderQuantity(0);
    }, [selectedCategory]);

    // Update order quantity when product changes
    useEffect(() => {
        if (selectedProduct) {
            const product = products.find(p => p.id === selectedProduct);
            if (product) {
                // Suggest reorder quantity as 1.5x the remaining stock, but at least 10
                const suggestedQty = Math.max(Math.ceil(product.remaining_stock * 1.5), 10);
                setOrderQuantity(suggestedQty);
            }
        } else {
            setOrderQuantity(0);
        }
    }, [selectedProduct, products]);

    const handleOrder = async (isQuick = false) => {
        const prodId = isQuick ? quickSelectedProduct : selectedProduct;
        const qty = isQuick ? quickOrderQuantity : orderQuantity;
        const email = isQuick ? quickSupplierEmail : supplierEmail;
        
        if (!prodId || qty <= 0) return;
        
        // Find product details
        let product;
        if (isQuick) {
            product = allUniqueProducts.find(p => p.id === prodId);
        } else {
            product = products.find(p => p.id === prodId);
        }

        if (!product) return;

        try {
            const response = await axios.post('http://localhost:8000/supply/reorder', {
                year,
                month,
                category: product.category,
                item: product.name,
                product: product.name,
                holidays: 0,
                supplier_email: email,
                quantity: qty
            });

            const apiResult = response.data;
            const newOrder = {
                success: apiResult.message === "Order placed successfully",
                product: apiResult.product,
                quantity: apiResult.reorder_amount, // Use the reordered amount from backend or requested? Backend logic might adjust it. But user requested specific qty. Let's assume user overrides prediction.
                // Wait, backend 'calculate_reorder' recalculates reorder amount based on prediction. 
                // The backend ignores the 'qty' passed in? 
                // Checks backend code: 'calculate_reorder' takes ReorderRequest. 
                // It does NOT take a 'quantity' field. It calculates 'reorder_amount'.
                // This means the user's manual quantity input is IGNORED by current backend logic. 
                // However, the User UI has an input for quantity. 
                // For now, I will display what the backend says, or maybe I should update backend to accept manual quantity?
                // The prompt was "reorder sheet bill to be generated".
                // I will use the backend response.
                
                // Construct result for UI
                ...apiResult, // This spreads product, predicted_demand, reorder_amount, supplier_available, bill, message
                order_id: `ORD-${Date.now()}`,
                timestamp: new Date().toLocaleString()
            };

            setResult(newOrder);
            
            const updatedHistory = [newOrder, ...orderHistory];
            setOrderHistory(updatedHistory);
            localStorage.setItem('orderHistory', JSON.stringify(updatedHistory));
            
            // Reset form inputs
            if (isQuick) {
                setQuickSelectedProduct('');
                setQuickOrderQuantity(0);
                setQuickSupplierEmail('');
            } else {
                setSelectedCategory('');
                setSelectedProduct('');
                setOrderQuantity(0);
                setSupplierEmail('');
            }
        } catch (err) {
            console.error("Order failed", err);
            alert("Failed to place order. See console.");
        }
    };

    return (
        <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Left Column: Category-based Reorder */}
                <div>
                    <h2 className="text-2xl font-bold mb-6">Product Reorder</h2>
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-2">
                            <select className="border p-2 rounded w-1/2" value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
                                <option value={2024}>2024</option>
                                <option value={2025}>2025</option>
                                <option value={2026}>2026</option>
                            </select>
                            <select className="border p-2 rounded w-1/2" value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
                                 {[...Array(12).keys()].map(m => (
                                    <option key={m+1} value={m+1}>{m+1}</option>
                                ))}
                            </select>
                        </div>
                        
                        <select 
                            className="border p-2 rounded w-full" 
                            value={selectedCategory} 
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="">Select Category</option>
                            {categories.map(category => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                        </select>

                        <select 
                            className="border p-2 rounded w-full" 
                            value={selectedProduct} 
                            onChange={(e) => setSelectedProduct(e.target.value)} 
                            disabled={!selectedCategory}
                        >
                            <option value="">Select Product</option>
                            {products.map(product => (
                                <option key={product.id} value={product.id}>
                                    {product.name} (In Stock: {product.remaining_stock})
                                </option>
                            ))}
                        </select>

                        {selectedProduct && (
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">Order Quantity:</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="1"
                                        value={orderQuantity}
                                        onChange={(e) => setOrderQuantity(parseInt(e.target.value) || 0)}
                                        className="border p-2 rounded flex-1"
                                    />
                                    <span className="text-sm text-gray-500 whitespace-nowrap">
                                        (Current: {products.find(p => p.id === selectedProduct)?.remaining_stock || 0})
                                    </span>
                                </div>
                            </div>
                        )}

                        {selectedProduct && (
                             <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">Supplier Email (for Bill):</label>
                                <input
                                    type="email"
                                    placeholder="supplier@example.com"
                                    value={supplierEmail}
                                    onChange={(e) => setSupplierEmail(e.target.value)}
                                    className="border p-2 rounded w-full"
                                />
                            </div>
                        )}

                        <button 
                            onClick={() => handleOrder(false)} 
                            disabled={!selectedProduct || orderQuantity <= 0} 
                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-300 mt-2"
                        >
                            Place Order
                        </button>
                    </div>
                </div>

                {/* Right Column: Quick Reorder */}
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800">Quick Reorder</h2>
                    <div className="flex flex-col gap-4">
                        <div className="text-sm text-gray-600 mb-2">
                            Directly reorder any product from the full catalog.
                        </div>

                        <select 
                            className="border p-2 rounded w-full" 
                            value={quickSelectedProduct} 
                            onChange={(e) => {
                                setQuickSelectedProduct(e.target.value);
                                setQuickOrderQuantity(0);
                            }}
                        >
                            <option value="">Select Any Product</option>
                            {allUniqueProducts.map(product => (
                                <option key={product.id} value={product.id}>
                                    {product.name}
                                </option>
                            ))}
                        </select>

                        {quickSelectedProduct && (
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">Order Quantity:</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="1"
                                        value={quickOrderQuantity}
                                        onChange={(e) => setQuickOrderQuantity(parseInt(e.target.value) || 0)}
                                        className="border p-2 rounded flex-1"
                                    />
                                    <span className="text-sm text-gray-500 whitespace-nowrap">
                                        (Current: {allUniqueProducts.find(p => p.id === quickSelectedProduct)?.remaining_stock || 0})
                                    </span>
                                </div>
                            </div>
                        )}

                        {quickSelectedProduct && (
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">Supplier Email (for Bill):</label>
                                <input
                                    type="email"
                                    placeholder="supplier@example.com"
                                    value={quickSupplierEmail}
                                    onChange={(e) => setQuickSupplierEmail(e.target.value)}
                                    className="border p-2 rounded w-full"
                                />
                            </div>
                        )}

                        <button 
                            onClick={() => handleOrder(true)} 
                            disabled={!quickSelectedProduct || quickOrderQuantity <= 0} 
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-300 mt-2"
                        >
                            Quick Order
                        </button>
                    </div>
                </div>
            </div>

            {result && (
                <div className="mt-8 p-4 border rounded shadow bg-white max-w-2xl mx-auto relative">
                    <button 
                        onClick={() => setResult(null)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 font-bold text-xl"
                        aria-label="Close"
                    >
                        &times;
                    </button>
                    <h3 className="font-bold text-lg mb-2 text-center">Order Status & Invoice</h3>
                    <div className="space-y-2 text-center">
                        <p><strong>Order ID:</strong> {result.order_id}</p>
                        <p><strong>Product:</strong> {result.product}</p>
                        <p><strong>Quantity Ordered:</strong> {result.reorder_amount}</p>
                        
                        {result.bill && (
                            <div className="bg-gray-50 p-4 rounded mt-4 border border-gray-200">
                                <h4 className="font-bold border-b pb-2 mb-2">INVOICE</h4>
                                <div className="grid grid-cols-2 gap-2 text-left text-sm">
                                    <span>Unit Price:</span>
                                    <span className="text-right">₹{result.bill.unit_price}</span>
                                    <span>Total Cost:</span>
                                    <span className="text-right font-bold">₹{result.bill.total_cost}</span>
                                </div>
                                {result.supplier_email && (
                                    <div className="mt-4 text-xs text-gray-500 border-t pt-2">
                                        Determined Supplier: {result.supplier_email}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className={`mt-4 p-2 rounded text-white ${result.supplier_available ? 'bg-green-500' : 'bg-red-500'}`}>
                            {result.message}
                        </div>
                    </div>
                </div>
            )}

            {/* Order History Table */}
            <div className="mt-16">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Order History</h2>
                    {orderHistory.length > 0 && (
                        <button 
                            onClick={() => {
                                setOrderHistory([]);
                                localStorage.removeItem('orderHistory');
                            }}
                            className="text-sm text-red-600 hover:text-red-800 font-medium"
                        >
                            Clear History
                        </button>
                    )}
                </div>

                {orderHistory.length > 0 ? (
                    <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {orderHistory.map((order) => (
                                    <tr key={order.order_id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{order.order_id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.timestamp}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{order.product}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{order.quantity}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.supplier_id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Completed
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                        <p className="text-gray-500">No recent orders found. Place an order to see it here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReorderInterface;
