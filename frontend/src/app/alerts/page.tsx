"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import alertService, { Alert, CreateAlertData } from '@/services/alertService';
import stockService from '@/services/stockService';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'triggered'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newAlert, setNewAlert] = useState<CreateAlertData>({
    ticker: '',
    type: 'price',
    threshold: 0,
    condition: 'above',
  });
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const data = await alertService.getAlerts();
        
        // Add some mock data for demo purposes
        const mockAlerts: Alert[] = [
          {
            id: 1,
            ticker: 'AAPL',
            type: 'price',
            threshold: 190.50,
            condition: 'above',
            is_active: true,
            created_at: '2023-08-01T10:30:00Z',
          },
          {
            id: 2,
            ticker: 'GOOGL',
            type: 'price',
            threshold: 125.75,
            condition: 'below',
            is_active: true,
            created_at: '2023-08-02T14:45:00Z',
          },
          {
            id: 3,
            ticker: 'MSFT',
            type: 'valuation_score',
            threshold: 8.5,
            condition: 'above',
            is_active: true,
            created_at: '2023-08-03T09:15:00Z',
          },
          {
            id: 4,
            ticker: 'AMZN',
            type: 'volume',
            threshold: 15000000,
            condition: 'above',
            is_active: false,
            created_at: '2023-08-04T11:20:00Z',
            triggered_at: '2023-08-05T10:10:00Z',
          },
          {
            id: 5,
            ticker: 'TSLA',
            type: 'price',
            threshold: 240.00,
            condition: 'below',
            is_active: true,
            created_at: '2023-08-05T16:30:00Z',
          },
        ];
        
        // Combine real and mock data
        const combinedAlerts = [...mockAlerts, ...data];
        setAlerts(combinedAlerts);
        setFilteredAlerts(combinedAlerts);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching alerts:', err);
        setError('Failed to load alerts. Please try again later.');
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  // Apply filters and search
  useEffect(() => {
    let result = [...alerts];
    
    // Apply filter
    if (filter === 'active') {
      result = result.filter(alert => alert.is_active);
    } else if (filter === 'triggered') {
      result = result.filter(alert => alert.triggered_at);
    }
    
    // Apply search
    if (searchTerm) {
      result = result.filter(alert => 
        alert.ticker.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredAlerts(result);
  }, [alerts, filter, searchTerm]);

  const handleSearchStock = async () => {
    if (newAlert.ticker.length < 1) return;
    
    setIsSearching(true);
    try {
      const results = await stockService.searchStocks(newAlert.ticker);
      setSearchResults(results.slice(0, 5)); // Limit to top 5 results
    } catch (err) {
      console.error('Error searching stocks:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateAlert = async () => {
    try {
      const createdAlert = await alertService.createAlert(newAlert);
      setAlerts([...alerts, createdAlert]);
      setIsCreating(false);
      // Reset form
      setNewAlert({
        ticker: '',
        type: 'price',
        threshold: 0,
        condition: 'above',
      });
      setSearchResults([]);
    } catch (err) {
      console.error('Error creating alert:', err);
      alert('Failed to create alert. Please try again.');
    }
  };

  const handleToggleAlert = async (alertId: number, currentState: boolean) => {
    try {
      await alertService.toggleAlert(alertId, !currentState);
      // Update state locally
      const updatedAlerts = alerts.map(alert => 
        alert.id === alertId ? { ...alert, is_active: !currentState } : alert
      );
      setAlerts(updatedAlerts);
    } catch (err) {
      console.error('Error toggling alert:', err);
      alert('Failed to update alert status. Please try again.');
    }
  };

  const handleDeleteAlert = async (alertId: number) => {
    if (window.confirm('Are you sure you want to delete this alert?')) {
      try {
        await alertService.deleteAlert(alertId);
        // Update state locally
        const updatedAlerts = alerts.filter(alert => alert.id !== alertId);
        setAlerts(updatedAlerts);
      } catch (err) {
        console.error('Error deleting alert:', err);
        alert('Failed to delete alert. Please try again.');
      }
    }
  };

  // Format alert type for display
  const formatAlertType = (type: string) => {
    switch (type) {
      case 'price': return 'Price';
      case 'volume': return 'Volume';
      case 'valuation_score': return 'Valuation Score';
      default: return type;
    }
  };

  // Format threshold value based on type
  const formatThreshold = (alert: Alert) => {
    switch (alert.type) {
      case 'price':
        return `$${alert.threshold.toFixed(2)}`;
      case 'volume':
        return alert.threshold.toLocaleString();
      case 'valuation_score':
        return alert.threshold.toFixed(1);
      default:
        return alert.threshold.toString();
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Price Alerts</h1>
          <div className="h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full mb-6"></div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="mb-4">
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Price Alerts</h1>
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
        <h1 className="text-2xl font-bold">Price Alerts</h1>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create Alert
        </button>
      </div>
      
      {/* Filter and search controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center mb-4 gap-4">
          <div className="relative w-full md:w-1/3">
            <input
              type="text"
              placeholder="Search by ticker..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                onClick={() => setSearchTerm('')}
              >
                ×
              </button>
            )}
          </div>
          
          <div className="flex space-x-2">
            <button
              className={`px-4 py-2 rounded-md ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`px-4 py-2 rounded-md ${
                filter === 'active'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
              onClick={() => setFilter('active')}
            >
              Active
            </button>
            <button
              className={`px-4 py-2 rounded-md ${
                filter === 'triggered'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
              onClick={() => setFilter('triggered')}
            >
              Triggered
            </button>
          </div>
        </div>
        
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {filteredAlerts.length} {filteredAlerts.length === 1 ? 'alert' : 'alerts'} found
        </div>
      </div>
      
      {/* Alerts list */}
      <div className="space-y-4">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => (
            <div 
              key={alert.id} 
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border-l-4 ${
                alert.triggered_at 
                  ? 'border-yellow-500' 
                  : alert.is_active
                    ? 'border-green-500'
                    : 'border-gray-500'
              }`}
            >
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                  <div>
                    <div className="flex items-center">
                      <Link href={`/stocks/${alert.ticker}`} className="text-xl font-bold text-primary-600 dark:text-primary-400 hover:underline">
                        {alert.ticker}
                      </Link>
                      <span className={`ml-3 px-2 py-1 text-xs rounded-full ${
                        alert.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {alert.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {alert.triggered_at && (
                        <span className="ml-2 px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          Triggered
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      {formatAlertType(alert.type)} {alert.condition} {formatThreshold(alert)}
                    </p>
                  </div>
                  
                  <div className="mt-4 md:mt-0 flex items-center">
                    <label className="flex items-center cursor-pointer mr-4">
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={alert.is_active}
                          onChange={() => handleToggleAlert(alert.id, alert.is_active)}
                        />
                        <div className={`block w-10 h-6 rounded-full ${
                          alert.is_active ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                        }`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${
                          alert.is_active ? 'transform translate-x-4' : ''
                        }`}></div>
                      </div>
                    </label>
                    
                    <button
                      onClick={() => handleDeleteAlert(alert.id)}
                      className="text-red-600 hover:text-red-800 dark:hover:text-red-400"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  Created: {new Date(alert.created_at).toLocaleString()}
                  {alert.triggered_at && (
                    <span className="ml-4">
                      Triggered: {new Date(alert.triggered_at).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">No Alerts Found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchTerm 
                ? `No alerts found matching "${searchTerm}".` 
                : filter !== 'all'
                  ? `No ${filter} alerts found.`
                  : 'You have not set up any price alerts yet.'}
            </p>
            <button 
              onClick={() => {
                setIsCreating(true);
                setSearchTerm('');
                setFilter('all');
              }} 
              className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded"
            >
              Create Your First Alert
            </button>
          </div>
        )}
      </div>
      
      {/* Create Alert Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Create New Alert</h3>
                <button onClick={() => setIsCreating(false)} className="text-gray-500 hover:text-gray-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ticker Symbol*
                  </label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={newAlert.ticker}
                      onChange={(e) => setNewAlert({...newAlert, ticker: e.target.value.toUpperCase()})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                      placeholder="e.g. AAPL"
                      required
                    />
                    <button
                      onClick={handleSearchStock}
                      className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-r-md"
                      disabled={isSearching}
                    >
                      {isSearching ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  
                  {/* Search results */}
                  {searchResults.length > 0 && (
                    <div className="mt-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm max-h-40 overflow-y-auto">
                      <ul>
                        {searchResults.map((result) => (
                          <li 
                            key={result.ticker} 
                            className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                            onClick={() => {
                              setNewAlert({...newAlert, ticker: result.ticker});
                              setSearchResults([]);
                            }}
                          >
                            <div className="flex justify-between">
                              <span className="font-medium">{result.ticker}</span>
                              <span className="text-gray-600 dark:text-gray-300">${result.price}</span>
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{result.name}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Alert Type*
                  </label>
                  <select
                    value={newAlert.type}
                    onChange={(e) => setNewAlert({...newAlert, type: e.target.value as 'price' | 'volume' | 'valuation_score'})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                    required
                  >
                    <option value="price">Price</option>
                    <option value="volume">Volume</option>
                    <option value="valuation_score">Valuation Score</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Condition*
                  </label>
                  <select
                    value={newAlert.condition}
                    onChange={(e) => setNewAlert({...newAlert, condition: e.target.value as 'above' | 'below'})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                    required
                  >
                    <option value="above">Above</option>
                    <option value="below">Below</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Threshold*
                  </label>
                  <div className="relative">
                    {newAlert.type === 'price' && (
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                    )}
                    <input
                      type="number"
                      value={newAlert.threshold}
                      onChange={(e) => setNewAlert({...newAlert, threshold: parseFloat(e.target.value)})}
                      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 ${
                        newAlert.type === 'price' ? 'pl-7' : ''
                      }`}
                      min="0"
                      step={newAlert.type === 'volume' ? '1000' : '0.01'}
                      required
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {newAlert.type === 'price' && 'Set the price point at which this alert should trigger.'}
                    {newAlert.type === 'volume' && 'Set the trading volume at which this alert should trigger.'}
                    {newAlert.type === 'valuation_score' && 'Set the valuation score at which this alert should trigger.'}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAlert}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md"
                  disabled={!newAlert.ticker || !newAlert.threshold}
                >
                  Create Alert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}