import { useState, useEffect, useRef, useCallback } from 'react';
import { debounce } from 'lodash';
import stockService, { SearchResult } from '@/services/stockService';

interface StockSearchProps {
  onSelect: (stock: SearchResult) => void;
  placeholder?: string;
  className?: string;
  initialValue?: string;
}

export default function StockSearch({ 
  onSelect, 
  placeholder = "Search for a stock...", 
  className = "",
  initialValue = ""
}: StockSearchProps) {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Create debounced search function
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await stockService.searchStocks(query);
        setResults(data);
      } catch (error) {
        console.error("Error searching stocks:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  // Effect to handle search term changes
  useEffect(() => {
    if (searchTerm) {
      debouncedSearch(searchTerm);
      setShowDropdown(true);
    } else {
      setResults([]);
      setShowDropdown(false);
    }
    
    // Reset selected index when search term changes
    setSelectedIndex(-1);
  }, [searchTerm, debouncedSearch]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle stock selection
  const handleSelectStock = (stock: SearchResult) => {
    setSearchTerm(`${stock.ticker} - ${stock.name}`);
    setShowDropdown(false);
    onSelect(stock);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;
    
    // Down arrow
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < results.length - 1 ? prev + 1 : prev
      );
    }
    // Up arrow
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
    }
    // Enter key
    else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelectStock(results[selectedIndex]);
      }
    }
    // Escape key
    else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => searchTerm && setShowDropdown(true)}
          placeholder={placeholder}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800"
          aria-label="Search for a stock"
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
          </div>
        )}
        {searchTerm && !loading && (
          <button
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            onClick={() => {
              setSearchTerm('');
              setResults([]);
              setShowDropdown(false);
            }}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {showDropdown && results.length > 0 && (
        <div 
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto"
        >
          <ul>
            {results.map((stock, index) => (
              <li 
                key={stock.ticker}
                onClick={() => handleSelectStock(stock)}
                className={`px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between ${
                  index === selectedIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
                }`}
              >
                <div>
                  <div className="font-medium">{stock.ticker} - {stock.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {stock.exchange_display || stock.exchange} • {stock.sector || stock.asset_class || 'N/A'}
                  </div>
                </div>
                {stock.price && (
                  <div className="text-right">
                    <div>${stock.price.toFixed(2)}</div>
                    {stock.change_percent && (
                      <div className={`text-xs ${
                        parseFloat(stock.change_percent) >= 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {parseFloat(stock.change_percent) >= 0 ? '+' : ''}{stock.change_percent}%
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {showDropdown && searchTerm && !loading && results.length === 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 p-3 text-center text-gray-500 dark:text-gray-400">
          No stocks found matching "{searchTerm}"
        </div>
      )}
    </div>
  );
}