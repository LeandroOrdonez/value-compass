"use client";

import { useState } from 'react';
import Link from 'next/link';
import { use } from 'react';
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
import portfolioService, { CreateHoldingData } from '@/services/portfolioService';
import { usePortfolioData, Timeframe } from '@/hooks/usePortfolioData';
import PortfolioHeader from '@/components/portfolios/PortfolioHeader';
import PortfolioTabs, { PortfolioTab } from '@/components/portfolios/PortfolioTabs';
import PerformanceTab from '@/components/portfolios/PerformanceTab';
import HoldingsTab from '@/components/portfolios/HoldingsTab';
import BreakdownTab from '@/components/portfolios/BreakdownTab';
import AddHoldingModal from '@/components/portfolios/AddHoldingModal';

// Register ChartJS components once
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

export default function PortfolioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const portfolioId = parseInt(resolvedParams.id, 10);

  const [timeframe, setTimeframe] = useState<Timeframe>('3m');
  const [activeTab, setActiveTab] = useState<PortfolioTab>('performance');
  const [isAddingHolding, setIsAddingHolding] = useState(false);
  const [newHolding, setNewHolding] = useState<CreateHoldingData>({
    ticker: '',
    shares: 0,
    cost_basis: 0,
    purchase_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const { portfolio, holdings, performanceData, loading, error, refresh } = usePortfolioData(
    portfolioId,
    timeframe
  );

  const handleAddHolding = async () => {
    try {
      await portfolioService.addHolding(portfolioId, newHolding);
      await refresh();
      setIsAddingHolding(false);
      setNewHolding({
        ticker: '',
        shares: 0,
        cost_basis: 0,
        purchase_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
    } catch (err) {
      console.error('Error adding holding:', err);
      alert('Failed to add holding. Please try again.');
    }
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
      <PortfolioHeader portfolio={portfolio} />
      <PortfolioTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'performance' && (
        <PerformanceTab
          performanceData={performanceData}
          timeframe={timeframe}
          onTimeframeChange={setTimeframe}
        />
      )}

      {activeTab === 'holdings' && <HoldingsTab holdings={holdings} onAddClick={() => setIsAddingHolding(true)} />}

      {activeTab === 'breakdown' && <BreakdownTab holdings={holdings} />}

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
        <Link
          href={`/portfolios/${portfolioId}/edit`}
          className="bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold py-2 px-4 rounded border border-gray-300 dark:border-gray-600 flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit Portfolio
        </Link>
      </div>

      <AddHoldingModal
        isOpen={isAddingHolding}
        onClose={() => setIsAddingHolding(false)}
        holding={newHolding}
        onChange={setNewHolding}
        onSubmit={handleAddHolding}
      />
    </div>
  );
}
