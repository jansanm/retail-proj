import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import productData from '../utils/productData';

const ReorderInterface = () => {
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedProduct, setSelectedProduct] = useState('');
    const [year, setYear] = useState(2024);
    const [month, setMonth] = useState(12);
    const [result, setResult] = useState(null);
    const [orderQuantity, setOrderQuantity] = useState(0);

    // Get unique categories from product data
    const categories = useMemo(() => {
        const cats = [...new Set(productData.map(item => item.product_category))];
        return cats;
    }, []);

    // Filter products based on selected category
    const products = useMemo(() => {
        if (!selectedCategory) return [];
        return productData
            .filter(item => item.product_category === selectedCategory)
            .map(item => ({
                id: item.product_id,
                name: item.product_name,
                remaining_stock: item.remaining_stock,
                supplier_id: item.supplier_id
            }));
    }, [selectedCategory]);

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

    const handleOrder = () => {
        if (!selectedProduct || orderQuantity <= 0) return;
        
        const product = products.find(p => p.id === selectedProduct);
        if (!product) return;

        // In a real app, this would be an API call to your backend
        // For now, we'll simulate a successful order
        setResult({
            success: true,
            product: product.name,
            quantity: orderQuantity,
            supplier_id: product.supplier_id,
            order_id: `ORD-${Date.now()}`,
            message: 'Order placed successfully!'
        });
        
        // Reset form after successful order
        setTimeout(() => {
            setSelectedCategory('');
            setSelectedProduct('');
            setOrderQuantity(0);
            setResult(null);
        }, 5000);
    };

    return (
        <div className="p-8">
            <h2 className="text-2xl font-bold mb-4">Product Reorder</h2>
            <div className="flex flex-col gap-4 max-w-md">
                <div className="flex gap-2">
                    <select className="border p-2 rounded w-1/2" value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
                        <option value={2024}>2024</option>
                        <option value={2025}>2025</option>
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
                        <input
                            type="number"
                            min="1"
                            value={orderQuantity}
                            onChange={(e) => setOrderQuantity(parseInt(e.target.value) || 0)}
                            className="border p-2 rounded"
                        />
                        <div className="text-sm text-gray-600">
                            Current Stock: {products.find(p => p.id === selectedProduct)?.remaining_stock || 0}
                        </div>
                    </div>
                )}

                <button 
                    onClick={handleOrder} 
                    disabled={!selectedProduct || orderQuantity <= 0} 
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-300 mt-4"
                >
                    Place Order
                </button>
            </div>

            {result && (
                <div className="mt-6 p-4 border rounded shadow bg-white">
                    <h3 className="font-bold text-lg mb-2">Order Status</h3>
                    <div className="space-y-2">
                        <p><strong>Order ID:</strong> {result.order_id}</p>
                        <p><strong>Product:</strong> {result.product}</p>
                        <p><strong>Quantity:</strong> {result.quantity}</p>
                        <p><strong>Supplier ID:</strong> {result.supplier_id}</p>
                        <div className={`mt-2 p-2 rounded text-center text-white ${result.success ? 'bg-green-500' : 'bg-red-500'}`}>
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
