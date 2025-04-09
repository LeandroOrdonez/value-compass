"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { use } from 'react';
import basketService, { Basket, BasketStock } from '@/services/basketService';
import StockSearch from '@/components/StockSearch';

interface SearchResult {
  ticker: string;
  name: string;
  exchange?: string;
  price?: number;
}

export default function BasketDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const basketId = parseInt(unwrappedParams.id);
  
  const [basket, setBasket] = useState<Basket | null>(null);
  const [stocks, setStocks] = useState<BasketStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [basketName, setBasketName] = useState('');
  const [basketDescription, setBasketDescription] = useState('');
  const [selectedStock, setSelectedStock] = useState<SearchResult | null>(null);
  const [stockDescription, setStockDescription] = useState('');
  const [showAddStockForm, setShowAddStockForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showValuationScore, setShowValuationScore] = useState(false);
  const [valuationScores, setValuationScores] = useState<any>(null);
  const [valuationLoading, setValuationLoading] = useState(false);

  useEffect(() => {
    const fetchBasketDetails = async () => {
      try {
        setLoading(true);
        const basketData = await basketService.getBasket(basketId);
        const stocksData = await basketService.getStocks(basketId);
        
        setBasket(basketData);
        setBasketName(basketData.name);
        setBasketDescription(basketData.description || '');
        setStocks(stocksData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching basket details:', err);
        setError('Failed to load basket details. Please try again later.');
        setLoading(false);
      }
    };

    if (basketId) {
      fetchBasketDetails();
    }
  }, [basketId]);

  const handleUpdateBasket = async () => {
    if (!basketName.trim()) return;
    
    try {
      setIsSubmitting(true);
      await basketService.updateBasket(basketId, {
        name: basketName.trim(),
        description: basketDescription.trim() || undefined
      });
      
      // Update local state
      if (basket) {
        setBasket({
          ...basket,
          name: basketName.trim(),
          description: basketDescription.trim() || null
        });
      }
      
      setIsEditing(false);
      setIsSubmitting(false);
    } catch (err) {
      console.error('Error updating basket:', err);
      setError('Failed to update basket. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleAddStock = async () => {
    if (!selectedStock) return;
    
    try {
      setIsSubmitting(true);
      const newStock = await basketService.addStock(basketId, {
        ticker: selectedStock.ticker,
        description: stockDescription.trim() || undefined
      });
      
      // Update local state
      setStocks([...stocks, newStock]);
      
      // Reset form
      setSelectedStock(null);
      setStockDescription('');
      setShowAddStockForm(false);
      setIsSubmitting(false);
    } catch (err) {
      console.error('Error adding stock to basket:', err);
      setError('Failed to add stock to basket. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleRemoveStock = async (stockId: number) => {
    if (window.confirm('Are you sure you want to remove this stock from the basket?')) {
      try {
        await basketService.removeStock(basketId, stockId);
        
        // Update local state
        setStocks(stocks.filter(stock => stock.id !== stockId));
      } catch (err) {
        console.error('Error removing stock from basket:', err);
        setError('Failed to remove stock. Please try again.');
      }
    }
  };

  const fetchValuationScores = async () => {
    try {
      setValuationLoading(true);
      const scores = await basketService.getValuationScores(basketId);
      setValuationScores(scores);
      setShowValuationScore(true);
      setValuationLoading(false);
    } catch (err) {
      console.error('Error fetching valuation scores:', err);
      setError('Failed to fetch valuation scores. Please try again.');
      setValuationLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-6"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/baskets" className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 flex items-center">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Baskets
          </Link>
        </div>
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

  if (!basket) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/baskets" className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 flex items-center">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Baskets
          </Link>
        </div>
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>Basket not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/baskets" className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 flex items-center">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Baskets
        </Link>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-6">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="basketName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Basket Name*
                </label>
                <input
                  type="text"
                  id="basketName"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                  value={basketName}
                  onChange={(e) => setBasketName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="basketDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  id="basketDescription"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                  rows={3}
                  value={basketDescription}
                  onChange={(e) => setBasketDescription(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-2">
                <h1 className="text-2xl font-bold">{basket.name}</h1>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  Edit
                </button>
              </div>
              {basket.description && (
                <p className="text-gray-600 dark:text-gray-400 mb-4">{basket.description}</p>
              )}
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Created on {new Date(basket.created_at).toLocaleDateString()}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Last updated on {new Date(basket.updated_at).toLocaleDateString()}
              </div>
            </>
          )}
        </div>
        
        {isEditing && (
          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 flex justify-end space-x-3">
            <button
              onClick={() => {
                setIsEditing(false);
                setBasketName(basket.name);
                setBasketDescription(basket.description || '');
              }}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateBasket}
              className="px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded-md"
              disabled={isSubmitting || !basketName.trim()}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Stocks in Basket</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAddStockForm(!showAddStockForm)}
            className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded flex items-center"
          >
            {showAddStockForm ? 'Cancel' : (
              <>
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Stock
              </>
            )}
          </button>
          {!showValuationScore && (
            <button
              onClick={fetchValuationScores}
              className="bg-secondary-600 hover:bg-secondary-700 text-white font-bold py-2 px-4 rounded flex items-center"
              disabled={valuationLoading}
            >
              {valuationLoading ? (
                <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : "Analyze Valuation"}
            </button>
          )}
        </div>
      </div>
      
      {/* Add Stock Form */}
      {showAddStockForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Add Stock to Basket</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search and Select Stock*
              </label>
              <StockSearch
                onSelect={(stock) => setSelectedStock(stock)}
                placeholder="Search for a stock..."
              />
              {selectedStock && (
                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <div className="flex justify-between">
                    <span className="font-medium">{selectedStock.ticker}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedStock(null)}
                      className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      ×
                    </button>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{selectedStock.name}</div>
                </div>
              )}
            </div>
            <div>
              <label htmlFor="stockDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes (Optional)
              </label>
              <input
                type="text"
                id="stockDescription"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                value={stockDescription}
                onChange={(e) => setStockDescription(e.target.value)}
                placeholder="Optional notes about this stock"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleAddStock}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md"
                disabled={isSubmitting || !selectedStock}
              >
                {isSubmitting ? 'Adding...' : 'Add to Basket'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Valuation Scores */}
      {showValuationScore && valuationScores && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Valuation Analysis</h3>
            <button
              onClick={() => setShowValuationScore(false)}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Hide
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Ticker
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Value Score
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Growth Score
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Quality Score
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Overall Score
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {valuationScores.scores.map((score: any) => (
                  <tr key={score.ticker}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600 dark:text-primary-400">
                      <Link href={`/stocks/${score.ticker}`} className="hover:underline">
                        {score.ticker}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      <div className="flex items-center">
                        <div className="w-12 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mr-2">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${Math.min(100, score.value_score * 10)}%` }}
                          ></div>
                        </div>
                        {score.value_score.toFixed(1)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      <div className="flex items-center">
                        <div className="w-12 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mr-2">
                          <div 
                            className="bg-green-600 h-2.5 rounded-full" 
                            style={{ width: `${Math.min(100, score.growth_score * 10)}%` }}
                          ></div>
                        </div>
                        {score.growth_score.toFixed(1)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      <div className="flex items-center">
                        <div className="w-12 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mr-2">
                          <div 
                            className="bg-purple-600 h-2.5 rounded-full" 
                            style={{ width: `${Math.min(100, score.quality_score * 10)}%` }}
                          ></div>
                        </div>
                        {score.quality_score.toFixed(1)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      <div className="flex items-center font-bold">
                        <div className="w-12 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mr-2">
                          <div 
                            className="bg-yellow-500 h-2.5 rounded-full" 
                            style={{ width: `${Math.min(100, score.overall_score * 10)}%` }}
                          ></div>
                        </div>
                        {score.overall_score.toFixed(1)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4">
            <h4 className="font-medium mb-2">Basket Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                <div className="text-sm text-gray-500 dark:text-gray-400">Average Value</div>
                <div className="text-lg font-bold">{valuationScores.summary.avg_value_score.toFixed(1)}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                <div className="text-sm text-gray-500 dark:text-gray-400">Average Growth</div>
                <div className="text-lg font-bold">{valuationScores.summary.avg_growth_score.toFixed(1)}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                <div className="text-sm text-gray-500 dark:text-gray-400">Average Quality</div>
                <div className="text-lg font-bold">{valuationScores.summary.avg_quality_score.toFixed(1)}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                <div className="text-sm text-gray-500 dark:text-gray-400">Average Overall</div>
                <div className="text-lg font-bold">{valuationScores.summary.avg_overall_score.toFixed(1)}</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Stocks List */}
      {stocks.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <h3 className="text-lg font-semibold mb-4">No Stocks in Basket</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Add stocks to your basket to track and analyze them as a group.
          </p>
          <button 
            onClick={() => setShowAddStockForm(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded"
          >
            Add Your First Stock
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Ticker
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Added On
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Notes
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {stocks.map((stock) => (
                  <tr key={stock.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link href={`/stocks/${stock.ticker}`} className="text-primary-600 dark:text-primary-400 hover:underline">
                        {stock.ticker}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {new Date(stock.added_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {stock.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => handleRemoveStock(stock.id)}
                        className="text-red-600 hover:text-red-800 dark:hover:text-red-400"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}