"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import portfolioService, { Portfolio, CreateHoldingData } from '@/services/portfolioService';

interface AddToPortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticker: string;
  currentPrice?: number;
}

export default function AddToPortfolioModal({ isOpen, onClose, ticker, currentPrice }: AddToPortfolioModalProps) {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(null);
  const [shares, setShares] = useState<number>(1);
  const [costBasis, setCostBasis] = useState<number | undefined>(undefined);
  const [purchaseDate, setPurchaseDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingPortfolios, setLoadingPortfolios] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchPortfolios = async () => {
      setLoadingPortfolios(true);
      setError(null);
      try {
        const data = await portfolioService.getPortfolios();
        setPortfolios(data);
        if (data.length > 0) {
          setSelectedPortfolioId(data[0].id);
        } else {
          setError("You don't have any portfolios yet. Please create a portfolio first.");
        }
      } catch (err) {
        console.error('Error fetching portfolios:', err);
        setError('Failed to load portfolios. Please try again.');
      } finally {
        setLoadingPortfolios(false);
      }
    };

    // Reset form state
    setShares(1);
    setCostBasis(currentPrice);
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setNotes('');

    fetchPortfolios();
  }, [isOpen, currentPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPortfolioId) {
      setError('Please select a portfolio');
      return;
    }

    if (!shares || shares <= 0) {
      setError('Shares must be greater than 0');
      return;
    }

    try {
      setAdding(true);
      setError(null);

      const holdingData: CreateHoldingData = {
        ticker,
        shares,
        cost_basis: costBasis,
        purchase_date: purchaseDate || undefined,
        notes: notes || undefined,
      };

      await portfolioService.addHolding(selectedPortfolioId, holdingData);

      setAdding(false);
      onClose();
      alert(`Successfully added ${shares} shares of ${ticker} to your portfolio`);
    } catch (err) {
      console.error('Error adding stock to portfolio:', err);
      setError('Failed to add stock to portfolio. Please try again.');
      setAdding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-xl font-semibold mb-4">Add {ticker} to Portfolio</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="portfolio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Select Portfolio
            </label>
            <select
              id="portfolio"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              value={selectedPortfolioId || ''}
              onChange={(e) => setSelectedPortfolioId(Number(e.target.value))}
              disabled={portfolios.length === 0 || loadingPortfolios}
              required
            >
              {portfolios.length === 0 ? (
                <option value="">No portfolios available</option>
              ) : (
                portfolios.map((portfolio) => (
                  <option key={portfolio.id} value={portfolio.id}>
                    {portfolio.name}
                  </option>
                ))
              )}
            </select>

            {portfolios.length === 0 && (
              <Link
                href="/portfolios/create"
                className="text-primary-600 dark:text-primary-400 hover:underline text-sm inline-block mt-2"
              >
                Create a new portfolio
              </Link>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="shares" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Number of Shares
            </label>
            <input
              id="shares"
              type="number"
              min="0.001"
              step="0.001"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              value={shares}
              onChange={(e) => setShares(parseFloat(e.target.value) || 0)}
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="costBasis" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cost Basis (per share)
            </label>
            <input
              id="costBasis"
              type="number"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              value={costBasis ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                setCostBasis(value === '' ? undefined : parseFloat(value));
              }}
              placeholder={currentPrice ? `$${currentPrice.toFixed(2)}` : ''}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Purchase Date
            </label>
            <input
              id="purchaseDate"
              type="date"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes about this holding"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={adding || portfolios.length === 0}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md font-medium disabled:opacity-50"
            >
              {adding ? 'Adding...' : 'Add to Portfolio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
