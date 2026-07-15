"use client";

import { ValuationScore } from '@/services/stockService';

interface ValuationSectionProps {
  valuationScore: ValuationScore | null;
}

const COMPONENT_DESCRIPTIONS: Record<string, string> = {
  pe_ratio: 'Price-to-Earnings ratio. Lower values typically indicate better value.',
  pb_ratio: 'Price-to-Book ratio. Compares market value to book value. Lower values may indicate undervaluation.',
  dividend_yield: 'Annual dividend as percentage of share price. Higher yields provide income and can indicate value.',
  debt_to_equity: 'Ratio of total debt to shareholders\' equity. Lower values indicate less financial risk.',
  profit_margin: 'Net income as percentage of revenue. Higher margins indicate better profitability.',
  roe: 'Return on Equity. Measures how efficiently a company uses equity to generate profits.',
  historical_volatility: 'Price variability over time. Lower volatility generally indicates less risk.',
  peer_pe_ratio: 'P/E ratio compared to peer companies. Lower relative values may indicate undervaluation.',
  peer_pb_ratio: 'P/B ratio compared to peer companies. Lower relative values may indicate undervaluation.',
};

function readableComponentName(component: string): string {
  return component
    .split('_')
    .map((word) => (word === 'pe' ? 'P/E' : word === 'pb' ? 'P/B' : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ');
}

function scoreColor(score: number): string {
  if (score >= 70) return 'bg-green-500';
  if (score >= 50) return 'bg-blue-500';
  if (score >= 30) return 'bg-yellow-500';
  return 'bg-red-500';
}

export default function ValuationSection({ valuationScore }: ValuationSectionProps) {
  if (!valuationScore) return null;

  return (
    <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Valuation Score Breakdown</h2>
      <div className="flex items-center mb-4">
        <p className="mr-4">
          <span className="text-gray-600 dark:text-gray-400">Overall Score:</span>
          <span className="ml-2 text-2xl font-bold text-primary-600 dark:text-primary-400">
            {valuationScore.score.toFixed(2)}
          </span>
        </p>
        <div className="relative group">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="absolute z-10 w-64 p-2 -mt-1 text-sm bg-white dark:bg-gray-800 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition duration-300 border border-gray-200 dark:border-gray-700 left-0 top-6 text-gray-600 dark:text-gray-300">
            Our proprietary valuation score based on the &quot;{valuationScore.rule_name}&quot; valuation model. Scores range from 0-100 with higher scores indicating potentially undervalued stocks.
          </div>
        </div>
      </div>

      {Object.entries(valuationScore.score_components).length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(valuationScore.score_components).map(([component, score]) => (
            <div key={component} className="bg-gray-50 dark:bg-gray-700 p-4 rounded relative group">
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium">{readableComponentName(component)} Score</p>
                <span className="font-bold">{score.toFixed(1)}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                <div
                  className={`${scoreColor(score)} h-2.5 rounded-full transition-all duration-500`}
                  style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                ></div>
              </div>
              <div className="absolute z-10 w-64 p-2 -mt-1 text-sm bg-white dark:bg-gray-800 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition duration-300 border border-gray-200 dark:border-gray-700 right-0 top-0 text-gray-600 dark:text-gray-300">
                {COMPONENT_DESCRIPTIONS[component] || 'Valuation metric score.'}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">No score component details available</p>
      )}
    </div>
  );
}
