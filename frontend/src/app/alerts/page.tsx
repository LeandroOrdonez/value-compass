"use client";

import { useState, useEffect } from 'react';
import alertService, { Alert, CreateAlertData } from '@/services/alertService';
import stockService from '@/services/stockService';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  
  const [newAlert, setNewAlert] = useState<CreateAlertData>({
    ticker: '',
    type: 'price',
    threshold: 0,
    condition: 'above',
  });

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const data = await alertService.getAlerts();
        setAlerts(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching alerts:', err);
        setError('Failed to load alerts. Please try again later.');
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    try {
      setSearching(true);
      const results = await stockService.searchStocks(searchTerm);
      setSearchResults(results);
      setSearching(false);
    } catch (err) {
      console.error('Error searching stocks:', err);
      setSearchResults([]);
      setSearching(false);
    }
  };

  const handleSelectStock = (ticker: string) => {
    setNewAlert({ ...newAlert, ticker });
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const createdAlert = await alertService.createAlert(newAlert);
      setAlerts([createdAlert, ...alerts]);
      setShowCreateForm(false);
      setNewAlert({
        ticker: '',
        type: 'price',
        threshold: 0,
        condition: 'above',
      });
    } catch (err) {
      console.error('Error creating alert:', err);
      alert('Failed to create alert. Please try again.');
    }
  };

  const handleDeleteAlert = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this alert?')) {
      try {
        await alertService.deleteAlert(id);
        setAlerts(alerts.filter(alert => alert.id !== id));
      } catch (err) {
        console.error('Error deleting alert:', err);
        alert('Failed to delete alert. Please try again.');
      }
    }
  };

  const handleToggleAlert = async (id: number, isActive: boolean) => {
    try {
      const updatedAlert = await alertService.toggleAlert(id, isActive);
      setAlerts(alerts.map(alert => 
        alert.id === id ? updatedAlert : alert
      ));
    } catch (err) {
      console.error('Error toggling alert:', err);
      alert('Failed to update alert. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Alerts</h1>
          <div className="h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Alerts</h1>
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
        <h1 className="text-2xl font-bold">Alerts</h1>
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded"
        >
          {showCreateForm ? 'Cancel' : 'Create Alert'}
        </button>
      </div>

      {/* Create Alert Form */}
      {showCreateForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Create New Alert</h2>
          
          {/* Stock Search */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search for a Stock
            </label>
            <div className="flex">
              <input
                type="text"
                className="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                placeholder="Enter ticker or company name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-r-md hover:bg-gray-300 dark:hover:bg-gray-500"
                onClick={handleSearch}
                disabled={searching || !searchTerm.trim()}
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <ul className="mt-2 border border-gray-300 dark:border-gray-600 rounded-md max-h-60 overflow-y-auto">
                {searchResults.map((stock) => (
                  <li 
                    key={stock.ticker} 
                    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => handleSelectStock(stock.ticker)}
                  >
                    <div className="font-medium">{stock.ticker}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{stock.name}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {/* Alert Form */}
          <form onSubmit={handleCreateAlert}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Selected Stock
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 bg-gray-50 dark:bg-gray-800"
                  value={newAlert.ticker}
                  readOnly
                  placeholder="Search and select a stock first"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Alert Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                  value={newAlert.type}
                  onChange={(e) => setNewAlert({ ...newAlert, type: e.target.value as any })}
                >
                  <option value="price">Price</option>
                  <option value="volume">Volume</option>
                  <option value="valuation_score">Valuation Score</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Condition
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                  value={newAlert.condition}
                  onChange={(e) => setNewAlert({ ...newAlert, condition: e.target.value as any })}
                >
                  <option value="above">Above</option>
                  <option value="below">Below</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Threshold Value
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                  value={newAlert.threshold}
                  onChange={(e) => setNewAlert({ ...newAlert, threshold: parseFloat(e.target.value) })}
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded"
                disabled={!newAlert.ticker}
              >
                Create Alert
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Alerts List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold">Your Alerts</h2>
        </div>
        
        {alerts.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No alerts set up yet. Create an alert to be notified when a stock meets your criteria.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {alerts.map((alert) => (
              <li key={alert.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                  <div className="mb-2 sm:mb-0">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{alert.ticker}</h3>
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        alert.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {alert.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {alert.type === 'price' ? 'Price' : alert.type === 'volume' ? 'Volume' : 'Valuation Score'} 
                      {' '}{alert.condition === 'above' ? 'above' : 'below'} 
                      {' '}{alert.threshold}{alert.type === 'price' ? '$' : alert.type === 'volume' ? ' shares' : ''}
                    </p>
                    {alert.triggered_at && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Last triggered: {new Date(alert.triggered_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleToggleAlert(alert.id, !alert.is_active)}
                      className={`text-sm ${
                        alert.is_active ? 'text-yellow-600 hover:text-yellow-800 dark:hover:text-yellow-400' : 'text-green-600 hover:text-green-800 dark:hover:text-green-400'
                      }`}
                    >
                      {alert.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDeleteAlert(alert.id)}
                      className="text-sm text-red-600 hover:text-red-800 dark:hover:text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}