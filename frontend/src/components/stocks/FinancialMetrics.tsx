"use client";

import { StockFinancialData } from '@/services/stockService';

interface FinancialMetricsProps {
  financialData: StockFinancialData | null;
}

interface MetricProps {
  label: string;
  tooltip: string;
  value: React.ReactNode;
}

function Metric({ label, tooltip, value }: MetricProps) {
  return (
    <div className="relative group">
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
      <p className="font-medium">{value}</p>
    </div>
  );
}

export default function FinancialMetrics({ financialData }: FinancialMetricsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Financial Metrics</h2>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Metric
            label="EPS"
            tooltip="Earnings Per Share. The portion of a company's profit allocated to each outstanding share of common stock. Higher is generally better."
            value={financialData?.eps ? `$${financialData.eps.toFixed(2)}` : 'N/A'}
          />
          <Metric
            label="Revenue"
            tooltip="Total income from sales of goods and services before expenses. Measures the company's top-line growth."
            value={financialData?.revenue ? `$${(financialData.revenue / 1000000000).toFixed(2)}B` : 'N/A'}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Metric
            label="Profit Margin"
            tooltip="Net income as a percentage of revenue. Measures the company's profitability and operational efficiency. Higher margins indicate better profitability."
            value={financialData?.profit_margin ? `${(financialData.profit_margin * 100).toFixed(2)}%` : 'N/A'}
          />
          <Metric
            label="ROE"
            tooltip="Return on Equity. Measures how efficiently a company uses its equity to generate profits. Higher ROE generally indicates better management effectiveness."
            value={financialData?.roe ? `${(financialData.roe * 100).toFixed(2)}%` : 'N/A'}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Metric
            label="Debt to Equity"
            tooltip="Ratio of total debt to shareholders' equity. Measures financial leverage. Lower ratios indicate less financial risk."
            value={financialData?.debt_to_equity?.toFixed(2) || 'N/A'}
          />
          <Metric
            label="Current Ratio"
            tooltip="Ratio of current assets to current liabilities. Measures a company's ability to pay short-term obligations. Ratios above 1.0 indicate good short-term financial strength."
            value={financialData?.current_ratio?.toFixed(2) || 'N/A'}
          />
        </div>
      </div>
    </div>
  );
}
