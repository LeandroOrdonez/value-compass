"use client";

import { Line } from 'react-chartjs-2';
import { PerformanceData, Timeframe } from '@/hooks/usePortfolioData';

interface PerformanceTabProps {
  performanceData: PerformanceData;
  timeframe: Timeframe;
  onTimeframeChange: (timeframe: Timeframe) => void;
}

const timeframes: Timeframe[] = ['1m', '3m', '6m', '1y', '5y'];

export default function PerformanceTab({
  performanceData,
  timeframe,
  onTimeframeChange,
}: PerformanceTabProps) {
  const chartData = {
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

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Portfolio Performance' },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    scales: {
      y: { title: { display: true, text: 'Value ($)' } },
      x: { title: { display: true, text: 'Date' } },
    },
    interaction: { mode: 'nearest' as const, axis: 'x' as const, intersect: false },
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Performance History</h2>
        <div className="flex space-x-2">
          {timeframes.map((period) => (
            <button
              key={period}
              onClick={() => onTimeframeChange(period)}
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
          <Line data={chartData} options={chartOptions} />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-500 dark:text-gray-400">
            No performance data available
          </div>
        )}
      </div>
    </div>
  );
}
