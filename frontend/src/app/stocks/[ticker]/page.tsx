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
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import stockService, { 
  StockHistoricalData, 
  StockFinancialData, 
  PeerCompany, 
  ValuationScore 
} from '@/services/stockService';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
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
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Market Cap</p>
            <p className="text-lg font-semibold">
              {financialData?.market_cap 
                ? `$${(financialData.market_cap / 1000000000).toFixed(2)}B` 
                : 'N/A'}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <p className="text-gray-500 dark:text-gray-400 text-sm">P/E Ratio</p>
            <p className="text-lg font-semibold">{financialData?.pe_ratio?.toFixed(2) || 'N/A'}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Dividend Yield</p>
            <p className="text-lg font-semibold">
              {financialData?.dividend_yield 
                ? `${(financialData.dividend_yield * 100).toFixed(2)}%` 
                : 'N/A'}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Value Score</p>
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
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">EPS</p>
                <p className="font-medium">${financialData?.eps?.toFixed(2) || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Revenue</p>
                <p className="font-medium">
                  {financialData?.revenue 
                    ? `$${(financialData.revenue / 1000000000).toFixed(2)}B` 
                    : 'N/A'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Profit Margin</p>
                <p className="font-medium">
                  {financialData?.profit_margin 
                    ? `${(financialData.profit_margin * 100).toFixed(2)}%` 
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">ROE</p>
                <p className="font-medium">
                  {financialData?.roe 
                    ? `${(financialData.roe * 100).toFixed(2)}%` 
                    : 'N/A'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Debt to Equity</p>
                <p className="font-medium">{financialData?.debt_to_equity?.toFixed(2) || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Current Ratio</p>
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
          <p className="mb-4">
            Overall Score: <span className="font-bold">{valuationScore.score.toFixed(2)}</span> 
            using rule: <span className="font-medium">{valuationScore.rule_name}</span>
          </p>
          
          {Object.entries(valuationScore.score_components).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(valuationScore.score_components).map(([component, score]) => (
                <div key={component} className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{component}</p>
                  <div className="flex items-center mt-2">
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                      <div 
                        className="bg-primary-600 h-2.5 rounded-full" 
                        style={{ width: `${Math.min(100, Math.max(0, score * 10))}%` }}
                      ></div>
                    </div>
                    <span className="ml-2 font-medium">{score.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No score component details available</p>
          )}
        </div>
      )}
      
      {/* Actions */}
      <div className="mt-8 flex flex-wrap gap-4">
        <button className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded flex items-center">
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
    </div>
  );
}