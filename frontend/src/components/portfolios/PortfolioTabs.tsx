"use client";

export type PortfolioTab = 'performance' | 'holdings' | 'breakdown';

interface PortfolioTabsProps {
  activeTab: PortfolioTab;
  onTabChange: (tab: PortfolioTab) => void;
}

const tabs: { key: PortfolioTab; label: string }[] = [
  { key: 'performance', label: 'Performance' },
  { key: 'holdings', label: 'Holdings' },
  { key: 'breakdown', label: 'Breakdown' },
];

export default function PortfolioTabs({ activeTab, onTabChange }: PortfolioTabsProps) {
  return (
    <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
      <ul className="flex flex-wrap -mb-px">
        {tabs.map(({ key, label }) => (
          <li key={key} className="mr-2">
            <button
              className={`inline-block py-4 px-4 border-b-2 rounded-t-lg ${
                activeTab === key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent hover:border-gray-300'
              }`}
              onClick={() => onTabChange(key)}
            >
              {label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
