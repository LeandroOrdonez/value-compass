"use client";

import { Doughnut } from 'react-chartjs-2';
import { PortfolioHolding } from '@/services/portfolioService';

interface BreakdownTabProps {
  holdings: PortfolioHolding[];
}

const COLORS = [
  'rgba(255, 99, 132, 0.6)',
  'rgba(54, 162, 235, 0.6)',
  'rgba(255, 206, 86, 0.6)',
  'rgba(75, 192, 192, 0.6)',
  'rgba(153, 102, 255, 0.6)',
  'rgba(255, 159, 64, 0.6)',
  'rgba(199, 199, 199, 0.6)',
];

const BORDER_COLORS = [
  'rgba(255, 99, 132, 1)',
  'rgba(54, 162, 235, 1)',
  'rgba(255, 206, 86, 1)',
  'rgba(75, 192, 192, 1)',
  'rgba(153, 102, 255, 1)',
  'rgba(255, 159, 64, 1)',
  'rgba(199, 199, 199, 1)',
];

export default function BreakdownTab({ holdings }: BreakdownTabProps) {
  const sectorData = holdings.reduce((acc, holding) => {
    const sector = holding.sector || 'Other';
    if (!acc[sector]) {
      acc[sector] = 0;
    }
    acc[sector] += holding.current_value || 0;
    return acc;
  }, {} as Record<string, number>);

  const chartData = {
    labels: Object.keys(sectorData),
    datasets: [
      {
        label: 'Sector Allocation',
        data: Object.values(sectorData),
        backgroundColor: COLORS,
        borderColor: BORDER_COLORS,
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'right' as const },
      title: { display: true, text: 'Portfolio Allocation by Sector' },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
            return `${label}: $${value.toLocaleString()} (${percentage}%)`;
          },
        },
      },
    },
  };

  const topHoldings = [...holdings]
    .sort((a, b) => (b.weight || 0) - (a.weight || 0))
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Sector Allocation</h2>
        <div className="h-80">
          {Object.keys(sectorData).length > 0 ? (
            <Doughnut data={chartData} options={chartOptions} />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-500 dark:text-gray-400">
              No sector data available
            </div>
          )}
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Top Holdings</h2>
        {topHoldings.length > 0 ? (
          <>
            <div className="mb-6">
              {topHoldings.map((holding, index) => (
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
              Showing top {topHoldings.length} of {holdings.length} holdings
            </div>
          </>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No holdings to display</p>
        )}
      </div>
    </div>
  );
}
