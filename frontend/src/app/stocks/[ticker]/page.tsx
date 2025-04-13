"use client";

import { useState, useEffect, use } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';
import stockService, { 
  StockHistoricalData, 
  StockFinancialData, 
  PeerCompany, 
  ValuationScore 
} from '@/services/stockService';
import portfolioService, { Portfolio, CreateHoldingData } from '@/services/portfolioService';
import StockDetailSearch from '@/components/StockDetailSearch';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

export default function StockDetailPage({ params }: { params: { ticker: string } }) {
  const resolvedParams = use(params);
  const ticker = resolvedParams.ticker;
  const [historicalData, setHistoricalData] = useState<StockHistoricalData[]>([]);
  const [financialData, setFinancialData] = useState<StockFinancialData | null>(null);
  const [peerCompanies, setPeerCompanies] = useState<PeerCompany[]>([]);
  const [valuationScore, setValuationScore] = useState<ValuationScore | null>(null);
  const [timeframe, setTimeframe] = useState<'1m' | '3m' | '6m' | '1y' | '5y'>('1y');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Portfolio management states
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(null);
  const [shares, setShares] = useState<number>(1);
  const [costBasis, setCostBasis] = useState<number | undefined>(undefined);
  const [purchaseDate, setPurchaseDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [addingToPortfolio, setAddingToPortfolio] = useState(false);
  const [addStockError, setAddStockError] = useState<string | null>(null);

  // Function to fetch user portfolios
  const fetchPortfolios = async () => {
    try {
      const portfoliosData = await portfolioService.getPortfolios();
      setPortfolios(portfoliosData);
      
      // Set default selected portfolio if available
      if (portfoliosData.length > 0 && !selectedPortfolioId) {
        setSelectedPortfolioId(portfoliosData[0].id);
      } else if (portfoliosData.length === 0) {
        setAddStockError("You don't have any portfolios yet. Please create a portfolio first.");
      }
    } catch (err) {
      console.error('Error fetching portfolios:', err);
      setAddStockError('Failed to load portfolios. Please try again.');
    }
  };
  
  // Function to handle opening the add to portfolio modal
  const handleAddToPortfolio = async () => {
    // Reset form state
    setShares(1);
    setCostBasis(historicalData.length > 0 ? historicalData[historicalData.length - 1].close : undefined);
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setAddStockError(null);
    
    // Fetch portfolios
    await fetchPortfolios();
    
    // Show modal
    setShowPortfolioModal(true);
  };
  
  // Function to handle adding stock to portfolio
  const handleSubmitAddToPortfolio = async () => {
    if (!selectedPortfolioId) {
      setAddStockError('Please select a portfolio');
      return;
    }
    
    if (shares <= 0) {
      setAddStockError('Shares must be greater than 0');
      return;
    }
    
    try {
      setAddingToPortfolio(true);
      setAddStockError(null);
      
      const holdingData: CreateHoldingData = {
        ticker,
        shares,
        cost_basis: costBasis,
        purchase_date: purchaseDate || undefined,
        notes: notes || undefined
      };
      
      await portfolioService.addHolding(selectedPortfolioId, holdingData);
      
      // Success
      setAddingToPortfolio(false);
      setShowPortfolioModal(false);
      
      // Show success message (could use a toast notification here)
      alert(`Successfully added ${shares} shares of ${ticker} to your portfolio`);
      
    } catch (err) {
      console.error('Error adding stock to portfolio:', err);
      setAddStockError('Failed to add stock to portfolio. Please try again.');
      setAddingToPortfolio(false);
    }
  };
  
  useEffect(() => {
    const fetchStockData = async () => {
      try {
        setLoading(true);
        
        // Calculate date range based on timeframe
        const endDate = new Date().toISOString().split('T')[0];
        let startDate: string;
        
        switch (timeframe) {
          case '1m':
            startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            break;
          case '3m':
            startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            break;
          case '6m':
            startDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            break;
          case '1y':
            startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            break;
          case '5y':
            startDate = new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            break;
          default:
            startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        }
        
        // Fetch data in parallel for better performance
        const [historicalResponse, financialResponse, valuationResponse] = await Promise.all([
          stockService.getHistoricalData(ticker, startDate, endDate),
          stockService.getFinancialData(ticker),
          stockService.getValuationScore(ticker)
        ]);
        
        setHistoricalData(historicalResponse);
        setFinancialData(financialResponse);
        setValuationScore(valuationResponse);
        
        // Fetch peer companies if we have the industry
        if (financialResponse.industry) {
          const peersResponse = await stockService.getPeerCompanies(financialResponse.industry);
          setPeerCompanies(peersResponse.filter(peer => peer.ticker !== ticker));
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching stock data:', err);
        setError('Failed to load stock data. Please try again later.');
        setLoading(false);
      }
    };

    fetchStockData();
  }, [ticker, timeframe]);

  // Prepare chart data
  const chartData = {
    labels: historicalData.map(item => new Date(item.date).toLocaleDateString()),
    datasets: [
      {
        label: `${ticker} Price`,
        data: historicalData.map(item => item.close),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        tension: 0.1,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${ticker} Stock Price History`,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: 'Price ($)',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Date',
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Loading {ticker} Data...</h1>
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">{ticker} - Error</h1>
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
      {/* Stock search component */}
      <div className="mb-4">
        <StockDetailSearch className="flex justify-end" />
      </div>
      
      {/* Header with company name and key stats */}
      <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">{financialData?.name || ticker}</h1>
            <p className="text-gray-600 dark:text-gray-400">{ticker} • {financialData?.sector} • {financialData?.industry}</p>
          </div>
          {historicalData.length > 0 && (
            <div className="mt-4 md:mt-0 text-3xl font-bold">
              ${historicalData[historicalData.length - 1].close.toFixed(2)}
              {historicalData.length > 1 && (
                <span className={`ml-2 text-base ${
                  historicalData[historicalData.length - 1].close > historicalData[historicalData.length - 2].close
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  {historicalData[historicalData.length - 1].close > historicalData[historicalData.length - 2].close ? '▲' : '▼'}
                  {(((historicalData[historicalData.length - 1].close - historicalData[historicalData.length - 2].close) / 
                    historicalData[historicalData.length - 2].close) * 100).toFixed(2)}%
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Key financial metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded relative group">
            <div className="flex items-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Market Cap</p>
              <div className="relative ml-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="absolute z-10 w-64 p-2 -mt-1 text-sm bg-white dark:bg-gray-800 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition duration-300 border border-gray-200 dark:border-gray-700 left-0 top-5 text-gray-600 dark:text-gray-300">
                  Total value of all outstanding shares. Calculated as the current share price multiplied by the total number of shares.
                </div>
              </div>
            </div>
            <p className="text-lg font-semibold">
              {financialData?.market_cap 
                ? `$${(financialData.market_cap / 1000000000).toFixed(2)}B` 
                : 'N/A'}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded relative group">
            <div className="flex items-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">P/E Ratio</p>
              <div className="relative ml-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="absolute z-10 w-64 p-2 -mt-1 text-sm bg-white dark:bg-gray-800 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition duration-300 border border-gray-200 dark:border-gray-700 left-0 top-5 text-gray-600 dark:text-gray-300">
                  Price-to-Earnings ratio. Measures the company's current share price relative to its earnings per share (EPS). Lower values may indicate undervaluation.
                </div>
              </div>
            </div>
            <p className="text-lg font-semibold">{financialData?.pe_ratio?.toFixed(2) || 'N/A'}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded relative group">
            <div className="flex items-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Dividend Yield</p>
              <div className="relative ml-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="absolute z-10 w-64 p-2 -mt-1 text-sm bg-white dark:bg-gray-800 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition duration-300 border border-gray-200 dark:border-gray-700 left-0 top-5 text-gray-600 dark:text-gray-300">
                  Annual dividend payments as a percentage of the share price. Higher yields may indicate better value for income-focused investors.
                </div>
              </div>
            </div>
            <p className="text-lg font-semibold">
              {financialData?.dividend_yield 
                ? `${(financialData.dividend_yield * 100).toFixed(2)}%` 
                : 'N/A'}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded relative group">
            <div className="flex items-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Value Score</p>
              <div className="relative ml-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="absolute z-10 w-64 p-2 -mt-1 text-sm bg-white dark:bg-gray-800 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition duration-300 border border-gray-200 dark:border-gray-700 left-0 top-5 text-gray-600 dark:text-gray-300">
                  Our proprietary score based on multiple financial metrics. Higher scores (closer to 100) suggest better value investment opportunities.
                </div>
              </div>
            </div>
            <p className="text-lg font-semibold">
              {valuationScore ? valuationScore.score.toFixed(2) : 'N/A'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Price chart with timeframe selection */}
      <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Price History</h2>
          <div className="flex space-x-2">
            {(['1m', '3m', '6m', '1y', '5y'] as const).map(period => (
              <button
                key={period}
                onClick={() => setTimeframe(period)}
                className={`px-3 py-1 rounded text-sm ${
                  timeframe === period 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
        <div className="h-80">
          {historicalData.length > 0 ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-500 dark:text-gray-400">
              No historical data available
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Detailed financial metrics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Financial Metrics</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="relative group">
                <div className="flex items-center">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">EPS</p>
                  <div className="relative ml-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute z-10 w-64 p-2 -mt-1 text-sm bg-white dark:bg-gray-800 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition duration-300 border border-gray-200 dark:border-gray-700 left-0 top-5 text-gray-600 dark:text-gray-300">
                      Earnings Per Share. The portion of a company's profit allocated to each outstanding share of common stock. Higher is generally better.
                    </div>
                  </div>
                </div>
                <p className="font-medium">${financialData?.eps?.toFixed(2) || 'N/A'}</p>
              </div>
              <div className="relative group">
                <div className="flex items-center">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Revenue</p>
                  <div className="relative ml-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute z-10 w-64 p-2 -mt-1 text-sm bg-white dark:bg-gray-800 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition duration-300 border border-gray-200 dark:border-gray-700 left-0 top-5 text-gray-600 dark:text-gray-300">
                      Total income from sales of goods and services before expenses. Measures the company's top-line growth.
                    </div>
                  </div>
                </div>
                <p className="font-medium">
                  {financialData?.revenue 
                    ? `$${(financialData.revenue / 1000000000).toFixed(2)}B` 
                    : 'N/A'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative group">
                <div className="flex items-center">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Profit Margin</p>
                  <div className="relative ml-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute z-10 w-64 p-2 -mt-1 text-sm bg-white dark:bg-gray-800 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition duration-300 border border-gray-200 dark:border-gray-700 left-0 top-5 text-gray-600 dark:text-gray-300">
                      Net income as a percentage of revenue. Measures the company's profitability and operational efficiency. Higher margins indicate better profitability.
                    </div>
                  </div>
                </div>
                <p className="font-medium">
                  {financialData?.profit_margin 
                    ? `${(financialData.profit_margin * 100).toFixed(2)}%` 
                    : 'N/A'}
                </p>
              </div>
              <div className="relative group">
                <div className="flex items-center">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">ROE</p>
                  <div className="relative ml-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute z-10 w-64 p-2 -mt-1 text-sm bg-white dark:bg-gray-800 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition duration-300 border border-gray-200 dark:border-gray-700 left-0 top-5 text-gray-600 dark:text-gray-300">
                      Return on Equity. Measures how efficiently a company uses its equity to generate profits. Higher ROE generally indicates better management effectiveness.
                    </div>
                  </div>
                </div>
                <p className="font-medium">
                  {financialData?.roe 
                    ? `${(financialData.roe * 100).toFixed(2)}%` 
                    : 'N/A'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative group">
                <div className="flex items-center">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Debt to Equity</p>
                  <div className="relative ml-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute z-10 w-64 p-2 -mt-1 text-sm bg-white dark:bg-gray-800 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition duration-300 border border-gray-200 dark:border-gray-700 left-0 top-5 text-gray-600 dark:text-gray-300">
                      Ratio of total debt to shareholders' equity. Measures financial leverage. Lower ratios indicate less financial risk.
                    </div>
                  </div>
                </div>
                <p className="font-medium">{financialData?.debt_to_equity?.toFixed(2) || 'N/A'}</p>
              </div>
              <div className="relative group">
                <div className="flex items-center">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Current Ratio</p>
                  <div className="relative ml-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute z-10 w-64 p-2 -mt-1 text-sm bg-white dark:bg-gray-800 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition duration-300 border border-gray-200 dark:border-gray-700 left-0 top-5 text-gray-600 dark:text-gray-300">
                      Ratio of current assets to current liabilities. Measures a company's ability to pay short-term obligations. Ratios above 1.0 indicate good short-term financial strength.
                    </div>
                  </div>
                </div>
                <p className="font-medium">{financialData?.current_ratio?.toFixed(2) || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Peer comparison */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Peer Companies</h2>
          {peerCompanies.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ticker</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Market Cap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {peerCompanies.slice(0, 5).map(peer => (
                    <tr key={peer.ticker} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <a href={`/stocks/${peer.ticker}`} className="text-primary-600 dark:text-primary-400 hover:underline">
                          {peer.ticker}
                        </a>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">{peer.name}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {peer.market_cap 
                          ? `$${(peer.market_cap / 1000000000).toFixed(2)}B` 
                          : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No peer companies available</p>
          )}
        </div>
      </div>
      
      {/* Valuation score breakdown */}
      {valuationScore && (
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Valuation Score Breakdown</h2>
          <div className="flex items-center mb-4">
            <p className="mr-4">
              <span className="text-gray-600 dark:text-gray-400">Overall Score:</span> 
              <span className="ml-2 text-2xl font-bold text-primary-600 dark:text-primary-400">{valuationScore.score.toFixed(2)}</span>
            </p>
            <div className="relative group">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="absolute z-10 w-64 p-2 -mt-1 text-sm bg-white dark:bg-gray-800 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition duration-300 border border-gray-200 dark:border-gray-700 left-0 top-6 text-gray-600 dark:text-gray-300">
                Our proprietary valuation score based on the "{valuationScore.rule_name}" valuation model. Scores range from 0-100 with higher scores indicating potentially undervalued stocks.
              </div>
            </div>
          </div>
          
          {Object.entries(valuationScore.score_components).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(valuationScore.score_components).map(([component, score]) => {
                // Convert component from code notation (pe_ratio) to readable format (P/E Ratio)
                const readableComponent = component
                  .split('_')
                  .map(word => word === 'pe' ? 'P/E' : word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ');
                
                // Determine color based on score (red to green gradient)
                const scoreColor = score >= 70 ? 'bg-green-500' : 
                                   score >= 50 ? 'bg-blue-500' : 
                                   score >= 30 ? 'bg-yellow-500' : 
                                   'bg-red-500';
                
                return (
                  <div key={component} className="bg-gray-50 dark:bg-gray-700 p-4 rounded relative group">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium">{readableComponent} Score</p>
                      <span className="font-bold">{score.toFixed(1)}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                      <div 
                        className={`${scoreColor} h-2.5 rounded-full transition-all duration-500`} 
                        style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                      ></div>
                    </div>
                    <div className="absolute z-10 w-64 p-2 -mt-1 text-sm bg-white dark:bg-gray-800 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition duration-300 border border-gray-200 dark:border-gray-700 right-0 top-0 text-gray-600 dark:text-gray-300">
                      {component === 'pe_ratio' && 'Price-to-Earnings ratio. Lower values typically indicate better value.'}
                      {component === 'pb_ratio' && 'Price-to-Book ratio. Compares market value to book value. Lower values may indicate undervaluation.'}
                      {component === 'dividend_yield' && 'Annual dividend as percentage of share price. Higher yields provide income and can indicate value.'}
                      {component === 'debt_to_equity' && 'Ratio of total debt to shareholders\' equity. Lower values indicate less financial risk.'}
                      {component === 'profit_margin' && 'Net income as percentage of revenue. Higher margins indicate better profitability.'}
                      {component === 'roe' && 'Return on Equity. Measures how efficiently a company uses equity to generate profits.'}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No score component details available</p>
          )}
        </div>
      )}
      
      {/* Actions */}
      <div className="mt-8 flex flex-wrap gap-4">
        <button 
          onClick={handleAddToPortfolio}
          className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add to Portfolio
        </button>
        <button className="bg-secondary-600 hover:bg-secondary-700 text-white font-bold py-2 px-4 rounded flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          Set Price Alert
        </button>
        <button className="bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold py-2 px-4 rounded border border-gray-300 dark:border-gray-600 flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Generate Report
        </button>
      </div>
      
      {/* Add to Portfolio Modal */}
      {showPortfolioModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 relative">
            <button 
              onClick={() => setShowPortfolioModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h2 className="text-xl font-semibold mb-4">Add {ticker} to Portfolio</h2>
            
            {/* Error message */}
            {addStockError && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-300">
                {addStockError}
              </div>
            )}
            
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSubmitAddToPortfolio();
            }}>
              {/* Portfolio selection */}
              <div className="mb-4">
                <label htmlFor="portfolio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Portfolio
                </label>
                <select
                  id="portfolio"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                  value={selectedPortfolioId || ''}
                  onChange={(e) => setSelectedPortfolioId(Number(e.target.value))}
                  disabled={portfolios.length === 0}
                  required
                >
                  {portfolios.length === 0 ? (
                    <option value="">No portfolios available</option>
                  ) : (
                    portfolios.map(portfolio => (
                      <option key={portfolio.id} value={portfolio.id}>
                        {portfolio.name}
                      </option>
                    ))
                  )}
                </select>
                
                {portfolios.length === 0 && (
                  <a 
                    href="/portfolios/create" 
                    className="text-primary-600 dark:text-primary-400 hover:underline text-sm inline-block mt-2"
                  >
                    Create a new portfolio
                  </a>
                )}
              </div>
              
              {/* Shares */}
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
                  onChange={(e) => setShares(Number(e.target.value))}
                  required
                />
              </div>
              
              {/* Cost basis */}
              <div className="mb-4">
                <label htmlFor="costBasis" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cost Basis ($ per share)
                </label>
                <input
                  id="costBasis"
                  type="number"
                  min="0.01"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                  value={costBasis}
                  onChange={(e) => setCostBasis(Number(e.target.value))}
                  placeholder="Current price if not specified"
                />
                {historicalData.length > 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Current Price: ${historicalData[historicalData.length - 1].close.toFixed(2)}
                  </p>
                )}
              </div>
              
              {/* Purchase date */}
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
              
              {/* Notes */}
              <div className="mb-6">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this investment..."
                />
              </div>
              
              {/* Total value calculation */}
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md mb-6">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Investment Value:</p>
                  <p className="text-lg font-semibold">
                    ${((costBasis || (historicalData.length > 0 ? historicalData[historicalData.length - 1].close : 0)) * shares).toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Number of Shares:</p>
                  <p className="text-lg font-semibold">{shares}</p>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPortfolioModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md flex items-center"
                  disabled={addingToPortfolio || portfolios.length === 0}
                >
                  {addingToPortfolio ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Adding...
                    </>
                  ) : (
                    'Add to Portfolio'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}