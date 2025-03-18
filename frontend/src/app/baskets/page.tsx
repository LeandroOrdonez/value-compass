"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import basketService, { Basket } from '@/services/basketService';

export default function BasketsPage() {
  const [baskets, setBaskets] = useState<Basket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBasketName, setNewBasketName] = useState('');
  const [newBasketDescription, setNewBasketDescription] = useState('');

  useEffect(() => {
    const fetchBaskets = async () => {
      try {
        setLoading(true);
        const data = await basketService.getBaskets();
        setBaskets(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching baskets:', err);
        setError('Failed to load baskets. Please try again later.');
        setLoading(false);
      }
    };

    fetchBaskets();
  }, []);

  const handleCreateBasket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBasketName.trim()) return;

    try {
      const data = {
        name: newBasketName.trim(),
        description: newBasketDescription.trim() || undefined,
      };
      
      const newBasket = await basketService.createBasket(data);
      setBaskets([...baskets, newBasket]);
      setNewBasketName('');
      setNewBasketDescription('');
      setShowCreateForm(false);
    } catch (err) {
      console.error('Error creating basket:', err);
      alert('Failed to create basket. Please try again.');
    }
  };

  const handleDeleteBasket = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this basket?')) {
      try {
        await basketService.deleteBasket(id);
        setBaskets(baskets.filter(basket => basket.id !== id));
      } catch (err) {
        console.error('Error deleting basket:', err);
        alert('Failed to delete basket. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Custom Stock Baskets</h1>
          <div className="h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 animate-pulse h-48">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Custom Stock Baskets</h1>
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
        <button 
          className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Custom Stock Baskets</h1>
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded"
        >
          {showCreateForm ? 'Cancel' : 'Create Basket'}
        </button>
      </div>

      {/* Create Basket Form */}
      {showCreateForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Create New Basket</h2>
          <form onSubmit={handleCreateBasket}>
            <div className="mb-4">
              <label htmlFor="basketName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Basket Name*
              </label>
              <input
                type="text"
                id="basketName"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                placeholder="Enter basket name"
                value={newBasketName}
                onChange={(e) => setNewBasketName(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="basketDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (Optional)
              </label>
              <textarea
                id="basketDescription"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                placeholder="Enter basket description"
                value={newBasketDescription}
                onChange={(e) => setNewBasketDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded"
                disabled={!newBasketName.trim()}
              >
                Create Basket
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Baskets List */}
      {baskets.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">No Custom Baskets Yet</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create custom baskets to group stocks together for analysis and valuation.
          </p>
          <button 
            onClick={() => setShowCreateForm(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded"
          >
            Create Your First Basket
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {baskets.map((basket) => (
            <div 
              key={basket.id} 
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
            >
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-2">
                  <Link href={`/baskets/${basket.id}`} className="hover:text-primary-600 dark:hover:text-primary-400">
                    {basket.name}
                  </Link>
                </h2>
                {basket.description && (
                  <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{basket.description}</p>
                )}
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Created on {new Date(basket.created_at).toLocaleDateString()}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Last updated on {new Date(basket.updated_at).toLocaleDateString()}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 flex justify-between">
                <Link 
                  href={`/baskets/${basket.id}`} 
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                >
                  View & Manage
                </Link>
                <button
                  onClick={() => handleDeleteBasket(basket.id)}
                  className="text-red-600 hover:text-red-800 dark:hover:text-red-400"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}