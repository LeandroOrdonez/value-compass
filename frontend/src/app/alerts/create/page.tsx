"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import alertService, { CreateAlertData } from '@/services/alertService';
import stockService from '@/services/stockService';
import StockSearch from '@/components/StockSearch';

interface SearchResult {
  ticker: string;
  name: string;
  exchange?: string;
  price?: number;
  change_percent?: string;
}

interface CurrentPrice {
  price: number;
  change_percent: string;
  last_updated: string;
}

export default function CreateAlertPage() {
  const router = useRouter();
  const [selectedStock, setSelectedStock] = useState<SearchResult | null>(null);
  const [currentPrice, setCurrentPrice] = useState<CurrentPrice | null>(null);
  const [alertData, setAlertData] = useState<CreateAlertData>({
    ticker: '',
    type: 'price',
    threshold: 0,
    condition: 'above',
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(false);
  const [stockLoading, setStockLoading] = useState(false);

  const handleStockSelect = async (stock: SearchResult) => {
    setSelectedStock(stock);
    setAlertData({
      ...alertData,
      ticker: stock.ticker,
      threshold: stock.price || 0,
    });
    
    if (stock.ticker) {
      try {
        setStockLoading(true);
        // Fetch current price and details for the selected stock
        const stockDetails = await stockService.getStockDetails(stock.ticker);
        if (stockDetails && stockDetails.current_price) {
          setCurrentPrice({
            price: stockDetails.current_price,
            change_percent: stockDetails.change_percent || '0.00',
            last_updated: new Date().toLocaleString(),
          });
          
          // Update threshold with current price
          setAlertData(prev => ({
            ...prev,
            threshold: stockDetails.current_price,
          }));
        }
      } catch (err) {
        console.error('Error fetching stock details:', err);
      } finally {
        setStockLoading(false);
      }
    }
  };

  const validateAlert = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!alertData.ticker) {
      newErrors.ticker = 'Please select a stock';
    }
    
    if (alertData.threshold <= 0 && alertData.type === 'price') {
      newErrors.threshold = 'Please enter a valid price threshold';
    }
    
    if (alertData.threshold <= 0 && alertData.type === 'volume') {
      newErrors.threshold = 'Please enter a valid volume threshold';
    }
    
    if (alertData.threshold <= 0 && alertData.type === 'valuation_score') {
      newErrors.threshold = 'Please enter a valid valuation score threshold (1-10)';
    }
    
    if (alertData.type === 'valuation_score' && (alertData.threshold < 1 || alertData.threshold > 10)) {
      newErrors.threshold = 'Valuation score must be between 1 and 10';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateAlert()) {
      return;
    }
    
    try {
      setLoading(true);
      await alertService.createAlert(alertData);
      router.push('/alerts');
    } catch (err) {
      console.error('Error creating alert:', err);
      setErrors({
        submit: 'Failed to create alert. Please try again.'
      });
      setLoading(false);
    }
  };

  const getThresholdLabel = () => {
    switch (alertData.type) {
      case 'price':
        return 'Price Threshold ($)';
      case 'volume':
        return 'Volume Threshold';
      case 'valuation_score':
        return 'Valuation Score Threshold (1-10)';
      default:
        return 'Threshold';
    }
  };

  const getThresholdDescription = () => {
    switch (alertData.type) {
      case 'price':
        return 'You will be alerted when the stock price reaches this threshold.';
      case 'volume':
        return 'You will be alerted when the trading volume reaches this threshold.';
      case 'valuation_score':
        return 'You will be alerted when the valuation score reaches this threshold (scale 1-10).';
      default:
        return '';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/alerts" className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 flex items-center">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Alerts
        </Link>
      </div>
      
      <h1 className="text-2xl font-bold mb-6">Create New Alert</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <form onSubmit={handleSubmit}>
              <div className="p-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Select Stock*
                    </label>
                    <StockSearch
                      onSelect={handleStockSelect}
                      placeholder="Search for a stock..."
                    />
                    {errors.ticker && <p className="mt-1 text-sm text-red-600">{errors.ticker}</p>}
                  </div>
                  
                  {selectedStock && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-lg font-semibold">{selectedStock.ticker}</div>
                          <div className="text-gray-600 dark:text-gray-400">{selectedStock.name}</div>
                          {selectedStock.exchange && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">{selectedStock.exchange}</div>
                          )}
                        </div>
                        {stockLoading ? (
                          <div className="animate-pulse h-10 w-20 bg-gray-200 dark:bg-gray-600 rounded"></div>
                        ) : currentPrice && (
                          <div className="text-right">
                            <div className="text-lg font-bold">${currentPrice.price.toFixed(2)}</div>
                            <div className={`text-sm ${parseFloat(currentPrice.change_percent) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {parseFloat(currentPrice.change_percent) >= 0 ? '+' : ''}{currentPrice.change_percent}%
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Alert Type*
                    </label>
                    <select
                      value={alertData.type}
                      onChange={(e) => setAlertData({...alertData, type: e.target.value as 'price' | 'volume' | 'valuation_score'})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                      required
                    >
                      <option value="price">Price Alert</option>
                      <option value="volume">Volume Alert</option>
                      <option value="valuation_score">Valuation Score Alert</option>
                    </select>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {alertData.type === 'price' && 'Receive alerts when a stock reaches a specified price level.'}
                      {alertData.type === 'volume' && 'Receive alerts when a stock reaches a specified trading volume.'}
                      {alertData.type === 'valuation_score' && 'Receive alerts when a stock reaches a specified valuation score.'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Condition*
                      </label>
                      <select
                        value={alertData.condition}
                        onChange={(e) => setAlertData({...alertData, condition: e.target.value as 'above' | 'below'})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                        required
                      >
                        <option value="above">Above</option>
                        <option value="below">Below</option>
                      </select>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Alert when the value is {alertData.condition} the threshold.
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {getThresholdLabel()}*
                      </label>
                      <div className="relative">
                        {alertData.type === 'price' && (
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500">$</span>
                          </div>
                        )}
                        <input
                          type="number"
                          value={alertData.threshold}
                          onChange={(e) => setAlertData({...alertData, threshold: parseFloat(e.target.value) || 0})}
                          className={`w-full ${alertData.type === 'price' ? 'pl-7' : 'pl-3'} py-2 border ${errors.threshold ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700`}
                          min={alertData.type === 'valuation_score' ? 1 : 0}
                          max={alertData.type === 'valuation_score' ? 10 : undefined}
                          step={alertData.type === 'price' ? '0.01' : alertData.type === 'volume' ? '1' : '0.1'}
                          required
                        />
                      </div>
                      {errors.threshold ? (
                        <p className="mt-1 text-sm text-red-600">{errors.threshold}</p>
                      ) : (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {getThresholdDescription()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex justify-between">
                <Link 
                  href="/alerts" 
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md"
                  disabled={loading || !selectedStock}
                >
                  {loading ? 'Creating Alert...' : 'Create Alert'}
                </button>
              </div>
              
              {errors.submit && (
                <div className="px-6 py-4 bg-red-50 dark:bg-red-900/30 border-t border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
                </div>
              )}
            </form>
          </div>
        </div>
        
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">About Price Alerts</h2>
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Set up alerts to be notified when stocks reach specific price levels, trading volumes, or valuation scores.
              </p>
              
              <div className="border-l-4 border-primary-500 bg-primary-50 dark:bg-primary-900/20 pl-4 py-2">
                <h3 className="font-medium text-primary-700 dark:text-primary-300">Price Alerts</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get notified when a stock rises above or falls below a specific price.
                </p>
              </div>
              
              <div className="border-l-4 border-secondary-500 bg-secondary-50 dark:bg-secondary-900/20 pl-4 py-2">
                <h3 className="font-medium text-secondary-700 dark:text-secondary-300">Volume Alerts</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get notified when a stock's trading volume exceeds or falls below a certain threshold.
                </p>
              </div>
              
              <div className="border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 pl-4 py-2">
                <h3 className="font-medium text-yellow-700 dark:text-yellow-300">Valuation Score Alerts</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get notified when a stock's valuation score reaches a specific value on our scale (1-10).
                </p>
              </div>
              
              <div className="mt-6">
                <h3 className="font-medium mb-2">How Alerts Work</h3>
                <ol className="list-decimal list-inside space-y-1 text-gray-600 dark:text-gray-400">
                  <li>Create an alert with your desired parameters</li>
                  <li>Our system checks your alert conditions regularly</li>
                  <li>When your alert condition is met, you'll be notified</li>
                  <li>Each alert can be toggled on/off as needed</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}