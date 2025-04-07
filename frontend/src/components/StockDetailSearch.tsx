import { useState } from 'react';
import { useRouter } from 'next/navigation';
import StockSearch from './StockSearch';
import { SearchResult } from '@/services/stockService';

interface StockDetailSearchProps {
  className?: string;
}

export default function StockDetailSearch({ className = '' }: StockDetailSearchProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSelectStock = (stock: SearchResult) => {
    router.push(`/stocks/${stock.ticker}`);
  };

  return (
    <div className={`relative ${className}`}>
      {isExpanded ? (
        <div className="absolute top-0 left-0 right-0 z-20 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Search Stocks</h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              aria-label="Close search"
            >
              ×
            </button>
          </div>
          <StockSearch 
            onSelect={(stock) => {
              handleSelectStock(stock);
              setIsExpanded(false);
            }}
            placeholder="Search by company name or ticker..."
          />
        </div>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>Search other stocks</span>
        </button>
      )}
    </div>
  );
}