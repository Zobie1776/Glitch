import React, { useEffect, useState } from 'react';
import { apiClient, useAuthContext } from '../../state/useAuth.js';

export default function ShopPanel({ onBack }) {
  const [products, setProducts] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [cosmetics, setCosmetics] = useState([]);
  const { token } = useAuthContext();

  useEffect(() => {
    apiClient('/shop/products')
      .then((response) => response.json())
      .then((data) => {
        setProducts(data.products || []);
        setSubscription(data.subscription || null);
        setCosmetics(data.cosmetics || []);
      });
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

  const handleSubscription = async () => {
    if (!token) {
      alert('Log in to activate your Rift Pass.');
      return;
    }
    const response = await apiClient('/shop/subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
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
      <section className="glass-panel rounded-2xl p-5 space-y-3">
        <h3 className="text-lg font-semibold text-glitch-neon">Gem Packs</h3>
        <ul className="grid md:grid-cols-3 gap-4">
          {products.map((product) => (
            <li key={product.id} className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-slate-100 uppercase tracking-widest text-xs">{product.name}</h4>
                <span className="text-glitch-neon text-sm">{product.gems} gems</span>
              </div>
              <p className="text-[0.65rem] text-slate-400">Perfect for unlocking cosmetics & power-ups.</p>
              <button className="btn-primary w-full" onClick={() => handlePurchase(product.id)}>
                Buy for ${(product.amount / 100).toFixed(2)}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {subscription && (
        <section className="glass-panel rounded-2xl p-5 flex flex-col md:flex-row gap-5 items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Ad-Free Rift Pass</p>
            <h3 className="text-2xl font-semibold text-glitch-neon">${(subscription.amount / 100).toFixed(2)}/month</h3>
            <ul className="mt-2 text-sm text-slate-300 list-disc list-inside space-y-1">
              {subscription.perks.map((perk) => (
                <li key={perk}>{perk}</li>
              ))}
            </ul>
          </div>
          <div className="space-y-2 w-full md:w-auto">
            <button className="btn-primary w-full" onClick={handleSubscription}>Activate</button>
            <p className="text-[0.65rem] text-slate-400 text-center uppercase tracking-[0.3em]">Includes ad removal + bonus monthly drops</p>
          </div>
        </section>
      )}

      <section className="glass-panel rounded-2xl p-5 space-y-3">
        <header className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-100">Cosmetics Showcase</h3>
          <span className="text-xs text-slate-400 uppercase tracking-[0.4em]">Style matters</span>
        </header>
        <ul className="grid md:grid-cols-3 gap-4 text-sm">
          {cosmetics.map((item) => (
            <li key={item.id} className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-4 flex flex-col gap-2">
              <p className="text-xs text-slate-400 uppercase tracking-widest">{item.type}</p>
              <p className="text-glitch-neon text-lg">{item.name}</p>
              <p className="text-[0.65rem] text-slate-500">{item.cost} gems</p>
              <button className="btn-secondary mt-auto">Preview</button>
            </li>
          ))}
        </ul>
        <p className="text-[0.65rem] text-slate-500 uppercase tracking-[0.4em]">Non-premium runners will see a 10s ad bumper between levels.</p>
      </section>
    </div>
  );
}
