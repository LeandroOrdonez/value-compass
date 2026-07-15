"use client";

import { useState } from 'react';
import { use } from 'react';
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
import StockDetailSearch from '@/components/StockDetailSearch';
import { useStockDetailData, Timeframe } from '@/hooks/useStockDetailData';
import StockHeader from '@/components/stocks/StockHeader';
import PriceChart from '@/components/stocks/PriceChart';
import FinancialMetrics from '@/components/stocks/FinancialMetrics';
import PeerCompanies from '@/components/stocks/PeerCompanies';
import ValuationSection from '@/components/stocks/ValuationSection';
import AddToPortfolioModal from '@/components/stocks/AddToPortfolioModal';

// Register ChartJS components once
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

export default function StockDetailPage({ params }: { params: Promise<{ ticker: string }> }) {
  const resolvedParams = use(params);
  const ticker = resolvedParams.ticker;
  const [timeframe, setTimeframe] = useState<Timeframe>('1y');
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);

  const {
    historicalData,
    financialData,
    peerCompanies,
    valuationScore,
    loading,
    error,
  } = useStockDetailData(ticker, timeframe);

  const currentPrice = historicalData.length > 0 ? historicalData[historicalData.length - 1].close : undefined;

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
      <div className="mb-4">
        <StockDetailSearch className="flex justify-end" />
      </div>

      <StockHeader
        ticker={ticker}
        financialData={financialData}
        historicalData={historicalData}
        valuationScore={valuationScore}
      />

      <PriceChart
        ticker={ticker}
        historicalData={historicalData}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <FinancialMetrics financialData={financialData} />
        <PeerCompanies peers={peerCompanies} />
      </div>

      <ValuationSection valuationScore={valuationScore} />

      <div className="mt-8 flex flex-wrap gap-4">
        <button
          onClick={() => setShowPortfolioModal(true)}
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

      <AddToPortfolioModal
        isOpen={showPortfolioModal}
        onClose={() => setShowPortfolioModal(false)}
        ticker={ticker}
        currentPrice={currentPrice}
      />
    </div>
  );
}
