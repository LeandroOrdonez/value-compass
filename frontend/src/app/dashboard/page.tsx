"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import stockService from '@/services/stockService';
import portfolioService from '@/services/portfolioService';
import basketService from '@/services/basketService';
import alertService from '@/services/alertService';

export default function Dashboard() {
  const [recentStocks, setRecentStocks] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [baskets, setBaskets] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Get portfolios, baskets and alerts first since they're more critical
        const [portfoliosData, basketsData, alertsData] = await Promise.all([
          portfolioService.getPortfolios(),
          basketService.getBaskets(),
          alertService.getTriggeredAlerts()
        ]);
        
        // Get trending stocks from Yahoo Finance
        let stocksData = await stockService.getTrendingStocks(5);
        
        // Fallback data if trending stocks fetch fails or returns empty results
        if (!stocksData || stocksData.length === 0) {
          stocksData = [
            { ticker: "AAPL", name: "Apple Inc.", price: 170.50, change_percent: "0.75" },
            { ticker: "MSFT", name: "Microsoft Corp.", price: 330.42, change_percent: "1.20" },
            { ticker: "GOOG", name: "Alphabet Inc.", price: 135.60, change_percent: "-0.30" },
            { ticker: "AMZN", name: "Amazon.com Inc.", price: 178.15, change_percent: "0.85" },
            { ticker: "META", name: "Meta Platforms Inc.", price: 475.90, change_percent: "2.10" }
          ];
        }

        // Create a formatted version of stock data for display
        const formattedStocks = stocksData.map((stock: any) => ({
          ticker: stock.ticker,
          name: stock.name,
          price: stock.price || 0,
          change_percent: stock.change_percent || '0.00' // Use provided value or default
        }));

        setRecentStocks(formattedStocks.slice(0, 5));
        setPortfolios(portfoliosData.slice(0, 3));
        setBaskets(basketsData.slice(0, 3));
        setAlerts(alertsData.slice(0, 5));
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 animate-pulse h-60">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
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
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
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
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Trending Stocks Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Trending</h2>
            <Link href="/stocks" className="text-primary-600 dark:text-primary-400 hover:underline text-sm">
              View All
            </Link>
          </div>
          {recentStocks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700">
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Symbol</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Price</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recentStocks.map((stock: any) => (
                    <tr key={stock.ticker} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link href={`/stocks/${stock.ticker}`} className="font-medium text-primary-600 dark:text-primary-400 hover:underline">
                          {stock.ticker}
                        </Link>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">${stock.price}</td>
                      <td className={`px-4 py-3 whitespace-nowrap ${parseFloat(stock.change_percent) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {parseFloat(stock.change_percent) >= 0 ? '+' : ''}{stock.change_percent}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No trending stocks available. Try again later.</p>
          )}
        </div>

        {/* Alerts Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Alerts</h2>
            <Link href="/alerts" className="text-primary-600 dark:text-primary-400 hover:underline text-sm">
              View All
            </Link>
          </div>
          {alerts.length > 0 ? (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {alerts.map((alert: any) => (
                <li key={alert.id} className="py-3">
                  <div className="flex items-start">
                    <div className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${alert.condition === 'above' ? 'bg-green-600' : 'bg-red-600'}`}></div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {alert.ticker} {alert.type === 'price' ? 'price' : alert.type === 'volume' ? 'volume' : 'valuation score'} 
                        {' '}{alert.condition === 'above' ? 'above' : 'below'} {alert.threshold}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Triggered: {new Date(alert.triggered_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No recent alerts.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolios Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Your Portfolios</h2>
            <Link href="/portfolios" className="text-primary-600 dark:text-primary-400 hover:underline text-sm">
              View All
            </Link>
          </div>
          {portfolios.length > 0 ? (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {portfolios.map((portfolio: any) => (
                <li key={portfolio.id} className="py-3">
                  <Link href={`/portfolios/${portfolio.id}`} className="block hover:bg-gray-50 dark:hover:bg-gray-700 -m-3 p-3 rounded-md">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{portfolio.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {portfolio.stocks_count} stocks • Updated {new Date(portfolio.updated_at).toLocaleDateString()}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div>
              <p className="text-gray-500 dark:text-gray-400 mb-4">No portfolios created yet.</p>
              <Link href="/portfolios/create" className="btn-primary text-sm">
                Create Portfolio
              </Link>
            </div>
          )}
        </div>

        {/* Custom Baskets Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Custom Baskets</h2>
            <Link href="/baskets" className="text-primary-600 dark:text-primary-400 hover:underline text-sm">
              View All
            </Link>
          </div>
          {baskets.length > 0 ? (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {baskets.map((basket: any) => (
                <li key={basket.id} className="py-3">
                  <Link href={`/baskets/${basket.id}`} className="block hover:bg-gray-50 dark:hover:bg-gray-700 -m-3 p-3 rounded-md">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{basket.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Created on {new Date(basket.created_at).toLocaleDateString()}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div>
              <p className="text-gray-500 dark:text-gray-400 mb-4">No custom baskets created yet.</p>
              <Link href="/baskets/create" className="btn-primary text-sm">
                Create Basket
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}