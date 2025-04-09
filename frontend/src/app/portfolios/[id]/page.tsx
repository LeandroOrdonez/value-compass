"use client";

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Line, Doughnut } from 'react-chartjs-2';
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
  ArcElement,
} from 'chart.js';
import portfolioService, { Portfolio, PortfolioHolding } from '@/services/portfolioService';
import stockService from '@/services/stockService';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

interface PerformanceData {
  dates: string[];
  values: number[];
}

export default function PortfolioDetailPage({ params }: { params: { id: string } }) {
  const resolvedParams = use(params);
  const portfolioId = parseInt(resolvedParams.id);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData>({ dates: [], values: [] });
  const [timeframe, setTimeframe] = useState<'1m' | '3m' | '6m' | '1y' | '5y'>('3m');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'performance' | 'holdings' | 'breakdown'>('performance');
  
  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        setLoading(true);
        
        // Fetch basic portfolio data
        const portfolioData = await portfolioService.getPortfolio(portfolioId);
        
        // Add mock data for demo purposes
        const enhancedPortfolio: Portfolio = {
          ...portfolioData,
          total_value: 125630.42,
          daily_change: 1.23,
          stocks_count: 8,
          performance: {
            day: 1.23,
            week: 2.45,
            month: -0.89,
            year: 12.37,
            all_time: 34.56,
          }
        };
        
        setPortfolio(enhancedPortfolio);
        
        // Fetch holdings
        const holdingsData = await portfolioService.getHoldings(portfolioId);
        
        // Enhance holdings with additional data (mock data for demo)
        const enhancedHoldings = holdingsData.map((holding, index) => {
          // Generate pseudo-random values for demo
          const currentPrice = 100 + Math.floor(Math.random() * 200);
          const shares = holding.shares || Math.floor(Math.random() * 100) + 1;
          const currentValue = currentPrice * shares;
          const costBasis = holding.cost_basis || (currentPrice * (0.8 + Math.random() * 0.4));
          const changePercent = ((currentPrice / costBasis) - 1) * 100;
          
          return {
            ...holding,
            current_price: currentPrice,
            current_value: currentValue,
            cost_basis: costBasis,
            change_percent: changePercent,
            change_value: currentValue - (costBasis * shares),
            weight: 0, // Will calculate after totaling
            name: `Company ${index + 1}`,
            sector: ['Technology', 'Healthcare', 'Consumer', 'Financial', 'Energy'][Math.floor(Math.random() * 5)],
          };
        });
        
        // Calculate portfolio weights
        const totalValue = enhancedHoldings.reduce((sum, h) => sum + (h.current_value || 0), 0);
        const finalHoldings = enhancedHoldings.map(h => ({
          ...h,
          weight: ((h.current_value || 0) / totalValue) * 100
        }));
        
        setHoldings(finalHoldings);
        
        // Generate mock performance data based on timeframe
        const dates: string[] = [];
        const values: number[] = [];
        let days: number;
        
        switch (timeframe) {
          case '1m': days = 30; break;
          case '3m': days = 90; break;
          case '6m': days = 180; break;
          case '1y': days = 365; break;
          case '5y': days = 365 * 5; break;
          default: days = 90;
        }
        
        const seedValue = 100000;
        let currentValue = seedValue;
        const today = new Date();
        
        for (let i = days; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          dates.push(date.toLocaleDateString());
          
          // Random walk with slight upward bias
          const change = (Math.random() - 0.48) * 0.015;
          currentValue = currentValue * (1 + change);
          values.push(currentValue);
        }
        
        setPerformanceData({ dates, values });
        setLoading(false);
      } catch (err) {
        console.error('Error fetching portfolio data:', err);
        setError('Failed to load portfolio data. Please try again later.');
        setLoading(false);
      }
    };

    fetchPortfolioData();
  }, [portfolioId, timeframe]);

  // Add holding dialog state
  const [isAddingHolding, setIsAddingHolding] = useState(false);
  const [newHolding, setNewHolding] = useState({
    ticker: '',
    shares: 0,
    cost_basis: 0,
    purchase_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const handleAddHolding = async () => {
    try {
      await portfolioService.addHolding(portfolioId, newHolding);
      // Refresh holdings
      const freshHoldings = await portfolioService.getHoldings(portfolioId);
      setHoldings(freshHoldings);
      setIsAddingHolding(false);
      // Reset form
      setNewHolding({
        ticker: '',
        shares: 0,
        cost_basis: 0,
        purchase_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
    } catch (err) {
      console.error('Error adding holding:', err);
      alert('Failed to add holding. Please try again.');
    }
  };

  // Prepare chart data for performance
  const performanceChartData = {
    labels: performanceData.dates,
    datasets: [
      {
        label: 'Portfolio Value',
        data: performanceData.values,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        tension: 0.1,
        fill: true,
      },
    ],
  };

  const performanceChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Portfolio Performance',
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
          text: 'Value ($)',
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

  // Prepare chart data for breakdown by sector
  const sectorData = holdings.reduce((acc, holding) => {
    const sector = holding.sector || 'Other';
    if (!acc[sector]) {
      acc[sector] = 0;
    }
    acc[sector] += holding.current_value || 0;
    return acc;
  }, {} as Record<string, number>);

  const breakdownChartData = {
    labels: Object.keys(sectorData),
    datasets: [
      {
        label: 'Sector Allocation',
        data: Object.values(sectorData),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(199, 199, 199, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(199, 199, 199, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const breakdownChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        text: 'Portfolio Allocation by Sector',
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: $${value.toLocaleString()} (${percentage}%)`;
          }
        }
      }
    },
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Loading Portfolio...</h1>
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

  if (error || !portfolio) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Portfolio - Error</h1>
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error || 'Failed to load portfolio.'}</p>
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
      {/* Header with portfolio name and key stats */}
      <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">{portfolio.name}</h1>
            {portfolio.description && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">{portfolio.description}</p>
            )}
          </div>
          <div className="mt-4 md:mt-0">
            <div className="text-3xl font-bold">
              {portfolio.total_value != null ? `$${portfolio.total_value.toLocaleString()}` : 'N/A'}
            </div>
            <div className={`text-right ${(portfolio.daily_change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(portfolio.daily_change || 0) >= 0 ? '▲' : '▼'} {Math.abs(portfolio.daily_change || 0).toFixed(2)}% today
            </div>
          </div>
        </div>
        
        {/* Performance metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Today</p>
            <p className={`text-lg font-semibold ${(portfolio.performance?.day || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(portfolio.performance?.day || 0) >= 0 ? '+' : ''}{portfolio.performance?.day?.toFixed(2) || '0.00'}%
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Week</p>
            <p className={`text-lg font-semibold ${(portfolio.performance?.week || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(portfolio.performance?.week || 0) >= 0 ? '+' : ''}{portfolio.performance?.week?.toFixed(2) || '0.00'}%
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Month</p>
            <p className={`text-lg font-semibold ${(portfolio.performance?.month || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(portfolio.performance?.month || 0) >= 0 ? '+' : ''}{portfolio.performance?.month?.toFixed(2) || '0.00'}%
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Year</p>
            <p className={`text-lg font-semibold ${(portfolio.performance?.year || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(portfolio.performance?.year || 0) >= 0 ? '+' : ''}{portfolio.performance?.year?.toFixed(2) || '0.00'}%
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <p className="text-gray-500 dark:text-gray-400 text-sm">All Time</p>
            <p className={`text-lg font-semibold ${(portfolio.performance?.all_time || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(portfolio.performance?.all_time || 0) >= 0 ? '+' : ''}{portfolio.performance?.all_time?.toFixed(2) || '0.00'}%
            </p>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <button
              className={`inline-block py-4 px-4 border-b-2 rounded-t-lg ${
                activeTab === 'performance'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('performance')}
            >
              Performance
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block py-4 px-4 border-b-2 rounded-t-lg ${
                activeTab === 'holdings'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('holdings')}
            >
              Holdings
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block py-4 px-4 border-b-2 rounded-t-lg ${
                activeTab === 'breakdown'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('breakdown')}
            >
              Breakdown
            </button>
          </li>
        </ul>
      </div>
      
      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Performance History</h2>
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
            {performanceData.dates.length > 0 ? (
              <Line data={performanceChartData} options={performanceChartOptions} />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500 dark:text-gray-400">
                No performance data available
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Holdings Tab */}
      {activeTab === 'holdings' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
          <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold">Portfolio Holdings</h2>
            <button 
              onClick={() => setIsAddingHolding(true)}
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
                        <br/>
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
      )}
      
      {/* Breakdown Tab */}
      {activeTab === 'breakdown' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Sector Allocation</h2>
            <div className="h-80">
              <Doughnut data={breakdownChartData} options={breakdownChartOptions} />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Top Holdings</h2>
            {holdings.length > 0 ? (
              <>
                <div className="mb-6">
                  {holdings
                    .sort((a, b) => (b.weight || 0) - (a.weight || 0))
                    .slice(0, 5)
                    .map((holding, index) => (
                      <div key={holding.id} className="mb-3">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">
                            {index + 1}. {holding.ticker} - {holding.name}
                          </span>
                          <span className="font-medium">{holding.weight?.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                          <div
                            className="bg-primary-600 h-2.5 rounded-full"
                            style={{ width: `${holding.weight}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 text-right">
                  Showing top 5 of {holdings.length} holdings
                </div>
              </>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No holdings to display</p>
            )}
          </div>
        </div>
      )}
      
      {/* Actions */}
      <div className="mt-8 flex flex-wrap gap-4">
        <button className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export to CSV
        </button>
        <button className="bg-secondary-600 hover:bg-secondary-700 text-white font-bold py-2 px-4 rounded flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Generate Report
        </button>
        <Link href={`/portfolios/${portfolioId}/edit`} className="bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold py-2 px-4 rounded border border-gray-300 dark:border-gray-600 flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit Portfolio
        </Link>
      </div>
      
      {/* Add Holding Modal */}
      {isAddingHolding && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Add New Holding</h3>
                <button onClick={() => setIsAddingHolding(false)} className="text-gray-500 hover:text-gray-700">
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
                  <input
                    type="text"
                    value={newHolding.ticker}
                    onChange={(e) => setNewHolding({...newHolding, ticker: e.target.value.toUpperCase()})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                    placeholder="e.g. AAPL"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Number of Shares*
                  </label>
                  <input
                    type="number"
                    value={newHolding.shares}
                    onChange={(e) => setNewHolding({...newHolding, shares: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cost Basis (per share)
                  </label>
                  <input
                    type="number"
                    value={newHolding.cost_basis}
                    onChange={(e) => setNewHolding({...newHolding, cost_basis: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 150.75"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={newHolding.purchase_date}
                    onChange={(e) => setNewHolding({...newHolding, purchase_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={newHolding.notes || ''}
                    onChange={(e) => setNewHolding({...newHolding, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                    rows={3}
                    placeholder="Optional notes about this holding"
                  ></textarea>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setIsAddingHolding(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddHolding}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md"
                  disabled={!newHolding.ticker || !newHolding.shares}
                >
                  Add Holding
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}