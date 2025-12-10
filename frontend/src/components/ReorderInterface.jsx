import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const ReorderInterface = () => {
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedProduct, setSelectedProduct] = useState('');
    const [year, setYear] = useState(2024);
    const [month, setMonth] = useState(12);
    const [result, setResult] = useState(null);
    const [orderQuantity, setOrderQuantity] = useState(0);
    const [productsData, setProductsData] = useState([]);

    // Fetch products from backend
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get('http://localhost:8001/data/products');
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
                supplier_id: item.supplier_id
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
            supplier_id: item.supplier_id
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

    const handleOrder = (isQuick = false) => {
        const prodId = isQuick ? quickSelectedProduct : selectedProduct;
        const qty = isQuick ? quickOrderQuantity : orderQuantity;
        
        if (!prodId || qty <= 0) return;
        
        // Find product details
        let product;
        if (isQuick) {
            product = allUniqueProducts.find(p => p.id === prodId);
        } else {
            product = products.find(p => p.id === prodId);
        }

        if (!product) return;

        // In a real app, this would be an API call to your backend
        // For now, we'll simulate a successful order
        setResult({
            success: true,
            product: product.name,
            quantity: qty,
            supplier_id: product.supplier_id,
            order_id: `ORD-${Date.now()}`,
            message: 'Order placed successfully!'
        });
        
        // Reset form inputs immediately, but keep the result visible until manually closed
        if (isQuick) {
            setQuickSelectedProduct('');
            setQuickOrderQuantity(0);
        } else {
            setSelectedCategory('');
            setSelectedProduct('');
            setOrderQuantity(0);
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
                    <h3 className="font-bold text-lg mb-2 text-center">Order Status</h3>
                    <div className="space-y-2 text-center">
                        <p><strong>Order ID:</strong> {result.order_id}</p>
                        <p><strong>Product:</strong> {result.product}</p>
                        <p><strong>Quantity:</strong> {result.quantity}</p>
                        <p><strong>Supplier ID:</strong> {result.supplier_id}</p>
                        <div className={`mt-2 p-2 rounded text-white ${result.success ? 'bg-green-500' : 'bg-red-500'}`}>
                            {result.message}
                        </div>
                        {result.success && (
                            <p className="text-sm text-gray-600 mt-2">
                                This is a simulation. In a real application, this would be sent to the supplier.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReorderInterface;
