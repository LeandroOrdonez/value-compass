"use client";

import Link from 'next/link';
import { PortfolioHolding } from '@/services/portfolioService';

interface HoldingsTabProps {
  holdings: PortfolioHolding[];
  onAddClick: () => void;
}

export default function HoldingsTab({ holdings, onAddClick }: HoldingsTabProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
      <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold">Portfolio Holdings</h2>
        <button
          onClick={onAddClick}
          className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Holding
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ticker</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Shares</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Current Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Current Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cost Basis</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Gain/Loss</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Weight</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {holdings.length > 0 ? (
              holdings.map((holding) => (
                <tr key={holding.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link href={`/stocks/${holding.ticker}`} className="font-medium text-primary-600 dark:text-primary-400 hover:underline">
                      {holding.ticker}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{holding.name || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{holding.shares.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">${holding.current_price?.toFixed(2) || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">${holding.current_value?.toLocaleString() || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">${holding.cost_basis?.toFixed(2) || '-'}</td>
                  <td className={`px-6 py-4 whitespace-nowrap ${(holding.change_percent || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(holding.change_percent || 0) >= 0 ? '+' : ''}{holding.change_percent?.toFixed(2)}%
                    <br />
                    <span className="text-xs">
                      {(holding.change_value || 0) >= 0 ? '+' : ''}${Math.abs(holding.change_value || 0).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{holding.weight?.toFixed(1)}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      className="text-primary-600 hover:text-primary-900 mr-2"
                      onClick={() => alert('Edit functionality would go here')}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-600 hover:text-red-900"
                      onClick={() => alert('Delete functionality would go here')}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  No holdings found in this portfolio.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
