"use client";

import { StockFinancialData, StockHistoricalData, ValuationScore } from '@/services/stockService';

interface StockHeaderProps {
  ticker: string;
  financialData: StockFinancialData | null;
  historicalData: StockHistoricalData[];
  valuationScore: ValuationScore | null;
}

interface MetricBoxProps {
  label: string;
  tooltip: string;
  value: React.ReactNode;
}

function MetricBox({ label, tooltip, value }: MetricBoxProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded relative group">
      <div className="flex items-center">
        <p className="text-gray-500 dark:text-gray-400 text-sm">{label}</p>
        <div className="relative ml-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="absolute z-10 w-64 p-2 -mt-1 text-sm bg-white dark:bg-gray-800 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition duration-300 border border-gray-200 dark:border-gray-700 left-0 top-5 text-gray-600 dark:text-gray-300">
            {tooltip}
          </div>
        </div>
      </div>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

export default function StockHeader({ ticker, financialData, historicalData, valuationScore }: StockHeaderProps) {
  const currentPrice = historicalData.length > 0 ? historicalData[historicalData.length - 1].close : null;
  const previousClose = historicalData.length > 1 ? historicalData[historicalData.length - 2].close : null;
  const changePercent = currentPrice && previousClose && previousClose > 0
    ? ((currentPrice - previousClose) / previousClose) * 100
    : null;

  return (
    <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{financialData?.name || ticker}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {ticker} • {financialData?.sector || 'N/A'} • {financialData?.industry || 'N/A'}
          </p>
        </div>
        {currentPrice !== null && (
          <div className="mt-4 md:mt-0 text-3xl font-bold">
            ${currentPrice.toFixed(2)}
            {changePercent !== null && (
              <span className={`ml-2 text-base ${changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {changePercent >= 0 ? '▲' : '▼'} {Math.abs(changePercent).toFixed(2)}%
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricBox
          label="Market Cap"
          tooltip="Total value of all outstanding shares. Calculated as the current share price multiplied by the total number of shares."
          value={financialData?.market_cap ? `$${(financialData.market_cap / 1000000000).toFixed(2)}B` : 'N/A'}
        />
        <MetricBox
          label="P/E Ratio"
          tooltip="Price-to-Earnings ratio. Measures the company's current share price relative to its earnings per share (EPS). Lower values may indicate undervaluation."
          value={financialData?.pe_ratio?.toFixed(2) || 'N/A'}
        />
        <MetricBox
          label="Dividend Yield"
          tooltip="Annual dividend payments as a percentage of the share price. Higher yields may indicate better value for income-focused investors."
          value={financialData?.dividend_yield ? `${(financialData.dividend_yield * 100).toFixed(2)}%` : 'N/A'}
        />
        <MetricBox
          label="Value Score"
          tooltip="Our proprietary score based on multiple financial metrics. Higher scores (closer to 100) suggest better value investment opportunities."
          value={valuationScore ? valuationScore.score.toFixed(2) : 'N/A'}
        />
      </div>
    </div>
  );
}
