"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import portfolioService, { CreatePortfolioData } from '@/services/portfolioService';
import StockSearch from '@/components/StockSearch';

interface SearchResult {
  ticker: string;
  name: string;
  exchange?: string;
  price?: number;
}

interface PortfolioHolding {
  ticker: string;
  name: string;
  shares: number;
  cost_basis: number | null;
  purchase_date: string | null;
  notes: string | null;
}

export default function CreatePortfolioPage() {
  const router = useRouter();
  const [portfolioData, setPortfolioData] = useState<CreatePortfolioData>({
    name: '',
    description: '',
  });
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [selectedStock, setSelectedStock] = useState<SearchResult | null>(null);
  const [shares, setShares] = useState<number>(0);
  const [costBasis, setCostBasis] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validatePortfolio = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!portfolioData.name.trim()) {
      newErrors.name = 'Portfolio name is required';
    }
    
    if (holdings.length === 0) {
      newErrors.holdings = 'Add at least one stock to your portfolio';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddHolding = () => {
    if (!selectedStock) {
      setErrors({...errors, stock: 'Please select a stock'});
      return;
    }
    
    if (shares <= 0) {
      setErrors({...errors, shares: 'Shares must be greater than 0'});
      return;
    }
    
    // Clear any previous errors
    const newErrors = {...errors};
    delete newErrors.stock;
    delete newErrors.shares;
    setErrors(newErrors);
    
    // Add the holding
    const newHolding: PortfolioHolding = {
      ticker: selectedStock.ticker,
      name: selectedStock.name,
      shares,
      cost_basis: costBasis ? parseFloat(costBasis) : null,
      purchase_date: purchaseDate || null,
      notes: notes || null,
    };
    
    setHoldings([...holdings, newHolding]);
    
    // Reset the form
    setSelectedStock(null);
    setShares(0);
    setCostBasis('');
    setPurchaseDate('');
    setNotes('');
  };

  const handleRemoveHolding = (ticker: string) => {
    setHoldings(holdings.filter(holding => holding.ticker !== ticker));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePortfolio()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Create the portfolio
      const portfolio = await portfolioService.createPortfolio({
        name: portfolioData.name,
        description: portfolioData.description,
      });
      
      // Add all holdings
      for (const holding of holdings) {
        await portfolioService.addHolding(portfolio.id, {
          ticker: holding.ticker,
          shares: holding.shares,
          cost_basis: holding.cost_basis || undefined,
          purchase_date: holding.purchase_date || undefined,
          notes: holding.notes || undefined,
        });
      }
      
      // Navigate to the portfolio page
      router.push(`/portfolios/${portfolio.id}`);
    } catch (err) {
      console.error('Error creating portfolio:', err);
      setErrors({
        submit: 'Failed to create portfolio. Please try again.'
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/portfolios" className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 flex items-center">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Portfolios
        </Link>
      </div>
      
      <h1 className="text-2xl font-bold mb-6">Create New Portfolio</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Portfolio Details</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="portfolioName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Portfolio Name*
                  </label>
                  <input
                    type="text"
                    id="portfolioName"
                    className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700`}
                    value={portfolioData.name}
                    onChange={(e) => setPortfolioData({...portfolioData, name: e.target.value})}
                    required
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>
                <div>
                  <label htmlFor="portfolioDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    id="portfolioDescription"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                    rows={3}
                    value={portfolioData.description}
                    onChange={(e) => setPortfolioData({...portfolioData, description: e.target.value})}
                  />
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Add Holdings</h2>
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
                  {errors.stock && <p className="mt-1 text-sm text-red-600">{errors.stock}</p>}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="shares" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Number of Shares*
                    </label>
                    <input
                      type="number"
                      id="shares"
                      className={`w-full px-3 py-2 border ${errors.shares ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700`}
                      value={shares || ''}
                      onChange={(e) => setShares(parseFloat(e.target.value) || 0)}
                      min="0.01"
                      step="0.01"
                    />
                    {errors.shares && <p className="mt-1 text-sm text-red-600">{errors.shares}</p>}
                  </div>
                  <div>
                    <label htmlFor="costBasis" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Cost Basis (per share)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <input
                        type="number"
                        id="costBasis"
                        className="w-full pl-7 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                        value={costBasis}
                        onChange={(e) => setCostBasis(e.target.value)}
                        min="0.01"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Purchase Date
                    </label>
                    <input
                      type="date"
                      id="purchaseDate"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notes
                    </label>
                    <input
                      type="text"
                      id="notes"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Optional notes about this holding"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="px-4 py-2 bg-secondary-600 hover:bg-secondary-700 text-white rounded-md"
                    onClick={handleAddHolding}
                    disabled={!selectedStock || shares <= 0}
                  >
                    Add to Portfolio
                  </button>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold mb-4">Portfolio Holdings</h2>
              {holdings.length === 0 ? (
                <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded-md text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    No holdings added yet. Use the form above to add stocks to your portfolio.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Ticker
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Shares
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Cost Basis
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Purchase Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {holdings.map((holding) => (
                        <tr key={holding.ticker}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600 dark:text-primary-400">
                            {holding.ticker}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                            {holding.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                            {holding.shares.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                            {holding.cost_basis !== null ? `$${holding.cost_basis.toFixed(2)}` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                            {holding.purchase_date || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            <button
                              type="button"
                              className="text-red-600 hover:text-red-800 dark:hover:text-red-400"
                              onClick={() => handleRemoveHolding(holding.ticker)}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {errors.holdings && <p className="mt-2 text-sm text-red-600">{errors.holdings}</p>}
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex justify-between">
            <Link 
              href="/portfolios" 
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Portfolio...' : 'Create Portfolio'}
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
  );
}