import React, { useEffect, useState } from 'react';
import { apiClient, useAuthContext } from '../../state/useAuth.js';

export default function ShopPanel({ onBack }) {
  const [products, setProducts] = useState([]);
  const { token } = useAuthContext();

  useEffect(() => {
    apiClient('/shop/products')
      .then((response) => response.json())
      .then((data) => setProducts(data.products || []));
  }, []);

  const handlePurchase = async (productId) => {
    if (!token) {
      alert('Please log in to buy items.');
      return;
    }

    const response = await apiClient('/shop/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ productId })
    });

    const data = await response.json();
    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Shop</h2>
        <button className="btn-secondary" onClick={onBack}>Back</button>
      </div>
      <ul className="grid md:grid-cols-3 gap-4">
        {products.map((product) => (
          <li key={product.id} className="bg-slate-950/40 border border-slate-800 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-glitch-neon">{product.name}</h3>
            <p className="text-slate-300 text-sm">{product.gems} gems</p>
            <button className="btn-primary w-full" onClick={() => handlePurchase(product.id)}>
              Buy for ${(product.amount / 100).toFixed(2)}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
