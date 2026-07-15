"use client";

import { AVAILABLE_METRICS, MetricConfig } from '@/services/valuationRuleService';

interface MetricEditorProps {
  metricKey: string;
  label: string;
  config: MetricConfig;
  onChange: (config: MetricConfig) => void;
  onRemove: () => void;
}

const FIELD_LABELS: Record<string, string> = {
  weight: 'Weight',
  ideal_range: 'Ideal Range',
  default_score: 'Default Score',
  negative_score: 'Negative Score',
  zero_score: 'Zero Score',
  unsustainable_score: 'Unsustainable Score',
};

const MAX_FIELD_NAMES: Record<string, string> = {
  max_pe: 'Max P/E',
  max_pb: 'Max P/B',
  max_yield: 'Max Yield',
  max_ratio: 'Max D/E Ratio',
  max_volatility: 'Max Volatility',
};

const METRIC_FIELDS: Record<string, string[]> = {
  pe_ratio: ['weight', 'ideal_range', 'max_pe', 'default_score', 'negative_score'],
  pb_ratio: ['weight', 'ideal_range', 'max_pb', 'default_score', 'negative_score'],
  dividend_yield: ['weight', 'ideal_range', 'max_yield', 'default_score', 'zero_score', 'unsustainable_score'],
  debt_to_equity: ['weight', 'ideal_range', 'max_ratio', 'default_score', 'negative_score'],
  profit_margin: ['weight', 'ideal_range', 'default_score'],
  roe: ['weight', 'ideal_range', 'default_score'],
  historical_volatility: ['weight', 'ideal_range', 'max_volatility', 'default_score'],
  peer_pe_ratio: ['weight', 'default_score'],
  peer_pb_ratio: ['weight', 'default_score'],
};

export default function MetricEditor({ metricKey, label, config, onChange, onRemove }: MetricEditorProps) {
  const fields = METRIC_FIELDS[metricKey] || ['weight', 'default_score'];
  const defaults = AVAILABLE_METRICS[metricKey]?.defaultConfig ?? {};

  const getNumeric = (obj: MetricConfig, key: string): number | undefined => {
    return (obj as unknown as Record<string, number | undefined>)[key];
  };

  const handleNumberChange = (field: string, value: string) => {
    if (value === '') {
      const defaultValue = getNumeric(defaults, field);
      onChange({ ...config, [field]: defaultValue });
      return;
    }
    onChange({ ...config, [field]: parseFloat(value) });
  };

  const handleIdealRangeChange = (index: 0 | 1, value: string) => {
    const defaultRange = defaults.ideal_range ?? [0, 0];
    const defaultValue = defaultRange[index];
    const numValue = value === '' ? defaultValue : parseFloat(value);
    const newRange: [number, number] = [
      index === 0 ? numValue : (config.ideal_range?.[0] ?? defaultRange[0]),
      index === 1 ? numValue : (config.ideal_range?.[1] ?? defaultRange[1]),
    ];
    onChange({ ...config, ideal_range: newRange });
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4 mb-4">
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-medium text-gray-900 dark:text-white">{label}</h4>
        <button
          type="button"
          onClick={onRemove}
          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
        >
          Remove
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => {
          if (field === 'ideal_range') {
            return (
              <div key={field} className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {FIELD_LABELS[field]}
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={config.ideal_range?.[0] ?? ''}
                    onChange={(e) => handleIdealRangeChange(0, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                    step="any"
                  />
                  <span className="text-gray-500 dark:text-gray-400">to</span>
                  <input
                    type="number"
                    value={config.ideal_range?.[1] ?? ''}
                    onChange={(e) => handleIdealRangeChange(1, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                    step="any"
                  />
                </div>
              </div>
            );
          }

          return (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {MAX_FIELD_NAMES[field] || FIELD_LABELS[field] || field}
              </label>
              <input
                type="number"
                value={getNumeric(config, field) ?? ''}
                onChange={(e) => handleNumberChange(field, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                step="any"
                min={field === 'weight' ? 0 : undefined}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
