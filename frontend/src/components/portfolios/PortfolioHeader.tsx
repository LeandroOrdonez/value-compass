"use client";

import { Portfolio } from '@/services/portfolioService';

interface PortfolioHeaderProps {
  portfolio: Portfolio;
}

export default function PortfolioHeader({ portfolio }: PortfolioHeaderProps) {
  const totalValue = portfolio.total_value ?? 0;
  const dailyChange = portfolio.daily_change ?? 0;
  const performance = portfolio.performance;

  const MetricBox = ({ label, value }: { label: string; value: number }) => (
    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
      <p className="text-gray-500 dark:text-gray-400 text-sm">{label}</p>
      <p className={`text-lg font-semibold ${value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {value >= 0 ? '+' : ''}{value.toFixed(2)}%
      </p>
    </div>
  );

  return (
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
          <div className={`text-right ${dailyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {dailyChange >= 0 ? '▲' : '▼'} {Math.abs(dailyChange).toFixed(2)}% today
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricBox label="Today" value={performance?.day ?? 0} />
        <MetricBox label="Week" value={performance?.week ?? 0} />
        <MetricBox label="Month" value={performance?.month ?? 0} />
        <MetricBox label="Year" value={performance?.year ?? 0} />
        <MetricBox label="All Time" value={performance?.all_time ?? 0} />
      </div>
    </div>
  );
}
