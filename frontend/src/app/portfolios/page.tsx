"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import portfolioService from '@/services/portfolioService';

interface Portfolio {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  total_value: number;
  daily_change: number;
  stocks_count: number;
}

export default function PortfoliosPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        setLoading(true);
        const data = await portfolioService.getPortfolios();
        setPortfolios(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching portfolios:', err);
        setError('Failed to load portfolios. Please try again later.');
        setLoading(false);
      }
    };

    fetchPortfolios();
  }, []);

  const handleDeletePortfolio = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this portfolio?')) {
      try {
        await portfolioService.deletePortfolio(id);
        setPortfolios(portfolios.filter(portfolio => portfolio.id !== id));
      } catch (err) {
        console.error('Error deleting portfolio:', err);
        alert('Failed to delete portfolio. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Your Portfolios</h1>
          <div className="h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 animate-pulse h-60">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
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
        <h1 className="text-2xl font-bold mb-6">Your Portfolios</h1>
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
        <h1 className="text-2xl font-bold">Your Portfolios</h1>
        <Link 
          href="/portfolios/create" 
          className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded"
        >
          Create Portfolio
        </Link>
      </div>

      {portfolios.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">No Portfolios Yet</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Start tracking your investments by creating your first portfolio.
          </p>
          <Link 
            href="/portfolios/create" 
            className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded"
          >
            Create Your First Portfolio
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolios.map((portfolio) => (
            <div 
              key={portfolio.id} 
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
            >
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-2">
                  <Link href={`/portfolios/${portfolio.id}`} className="hover:text-primary-600 dark:hover:text-primary-400">
                    {portfolio.name}
                  </Link>
                </h2>
                {portfolio.description && (
                  <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{portfolio.description}</p>
                )}
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Total Value:</span>
                  <span className="font-medium">${portfolio.total_value.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Daily Change:</span>
                  <span className={`font-medium ${portfolio.daily_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {portfolio.daily_change >= 0 ? '+' : ''}{portfolio.daily_change.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between mb-4">
                  <span className="text-gray-600 dark:text-gray-400">Stocks:</span>
                  <span className="font-medium">{portfolio.stocks_count}</span>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Updated {new Date(portfolio.updated_at).toLocaleDateString()}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 flex justify-between">
                <Link 
                  href={`/portfolios/${portfolio.id}`} 
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                >
                  View Details
                </Link>
                <button
                  onClick={() => handleDeletePortfolio(portfolio.id)}
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