"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import stockService from '@/services/stockService';
import StockSearch from '@/components/StockSearch';

interface Stock {
  ticker: string;
  name: string;
  price: number;
  change_percent: string;
  market_cap: string;
  pe_ratio: number | null;
  sector: string | null;
}

export default function StocksPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('ticker');
  const [sortDirection, setSortDirection] = useState('asc');
  const [sectors, setSectors] = useState<string[]>([]);
  const [selectedSector, setSelectedSector] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch trending stocks data
  useEffect(() => {
    const fetchStocks = async () => {
      try {
        setLoading(true);
        
        // Use getTrendingStocks to get a list of trending stocks
        const data = await stockService.getTrendingStocks(20); // Get up to 20 trending stocks
        
        // Format the data to match our Stock interface
        const formattedData = data.map((item: any) => ({
          ticker: item.ticker,
          name: item.name || '',
          price: item.price || 0,
          change_percent: item.change_percent || '0.00',
          market_cap: item.market_cap ? `$${(item.market_cap / 1000000000).toFixed(2)}B` : 'N/A',
          pe_ratio: item.pe_ratio,
          sector: item.sector
        }));
        
        setStocks(formattedData);
        setFilteredStocks(formattedData);
        
        // Extract unique sectors
        const uniqueSectors = Array.from(new Set(formattedData.map(stock => stock.sector).filter(Boolean)))
          .sort() as string[];
        setSectors(uniqueSectors);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching trending stocks:', err);
        setError('Failed to load trending stocks. Please try again later.');
        setLoading(false);
      }
    };

    fetchStocks();
  }, []);

  // Filter and sort stocks
  useEffect(() => {
    let result = [...stocks];
    
    // Filter by search term
    if (searchTerm) {
      result = result.filter(stock => 
        stock.ticker.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (stock.name && stock.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Filter by sector
    if (selectedSector !== 'all') {
      result = result.filter(stock => stock.sector === selectedSector);
    }
    
    // Sort stocks
    result.sort((a, b) => {
      // Handle null values
      if (sortBy === 'pe_ratio') {
        if (a.pe_ratio === null && b.pe_ratio === null) return 0;
        if (a.pe_ratio === null) return 1;
        if (b.pe_ratio === null) return -1;
      }
      
      let valA = a[sortBy as keyof Stock];
      let valB = b[sortBy as keyof Stock];
      
      // Special handling for numeric strings like market_cap
      if (sortBy === 'market_cap') {
        valA = parseFloat(valA as string) || 0;
        valB = parseFloat(valB as string) || 0;
      }
      
      // Special handling for change_percent
      if (sortBy === 'change_percent') {
        valA = parseFloat(valA as string) || 0;
        valB = parseFloat(valB as string) || 0;
      }
      
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredStocks(result);
  }, [stocks, searchTerm, sortBy, sortDirection, selectedSector]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Trending Stocks</h1>
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Trending Stocks</h1>
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
      <h1 className="text-2xl font-bold mb-6">Trending Stocks</h1>
      
      {/* Search and filter controls */}
      <div className="flex flex-col md:flex-row md:items-center mb-6 gap-4">
        <div className="w-full md:w-1/3">
          <StockSearch 
            onSelect={(stock) => {
              // If the stock isn't already in the list, add it
              if (!stocks.some(s => s.ticker === stock.ticker)) {
                const newStock = {
                  ticker: stock.ticker,
                  name: stock.name || '',
                  price: stock.price || 0,
                  change_percent: stock.change_percent || '0.00',
                  market_cap: stock.market_cap ? `$${(stock.market_cap / 1000000000).toFixed(2)}B` : 'N/A',
                  pe_ratio: stock.pe_ratio || null,
                  sector: stock.sector || null
                };
                setStocks(prev => [...prev, newStock]);
              }
              
              // Set search term to filter to this stock
              setSearchTerm(stock.ticker);
            }}
            placeholder="Search for a stock..."
          />
        </div>
        
        <div className="w-full md:w-auto">
          <select
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800"
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
          >
            <option value="all">All Sectors</option>
            {sectors.map((sector) => (
              <option key={sector} value={sector}>
                {sector}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Stocks table */}
      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('ticker')}
              >
                Symbol {getSortIcon('ticker')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('name')}
              >
                Name {getSortIcon('name')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('price')}
              >
                Price {getSortIcon('price')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('change_percent')}
              >
                Change {getSortIcon('change_percent')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('market_cap')}
              >
                Market Cap {getSortIcon('market_cap')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('pe_ratio')}
              >
                P/E Ratio {getSortIcon('pe_ratio')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('sector')}
              >
                Sector {getSortIcon('sector')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredStocks.length > 0 ? (
              filteredStocks.map((stock) => (
                <tr key={stock.ticker} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link href={`/stocks/${stock.ticker}`} className="font-medium text-primary-600 dark:text-primary-400 hover:underline">
                      {stock.ticker}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{stock.name || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">${stock.price.toFixed(2)}</td>
                  <td className={`px-6 py-4 whitespace-nowrap ${parseFloat(stock.change_percent) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {parseFloat(stock.change_percent) >= 0 ? '+' : ''}{stock.change_percent}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{stock.market_cap}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{stock.pe_ratio?.toFixed(2) || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{stock.sector || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/stocks/${stock.ticker}`}
                      className="text-primary-600 dark:text-primary-400 hover:text-primary-900 mr-3"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  No stocks found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-6 text-center text-gray-500 dark:text-gray-400 text-sm">
        Showing {filteredStocks.length} of {stocks.length} stocks
      </div>
    </div>
  );
}