"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import valuationRuleService, {
  AVAILABLE_METRICS,
  CreateRuleData,
  MetricConfig,
  RuleConfig,
  UpdateRuleData,
} from '@/services/valuationRuleService';
import MetricEditor from './MetricEditor';

interface MetricEntry {
  key: string;
  config: MetricConfig;
}

interface RuleFormProps {
  mode: 'create' | 'edit';
  userId: number;
  ruleId?: number;
  initialName?: string;
  initialDescription?: string;
  initialMetrics?: MetricEntry[];
}

export default function RuleForm({
  mode,
  userId,
  ruleId,
  initialName = '',
  initialDescription = '',
  initialMetrics = [],
}: RuleFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [metrics, setMetrics] = useState<MetricEntry[]>(
    initialMetrics.length > 0
      ? initialMetrics
      : [{ key: 'pe_ratio', config: AVAILABLE_METRICS.pe_ratio.defaultConfig }]
  );
  const [selectedMetric, setSelectedMetric] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = 'Rule name is required';
    }
    if (metrics.length === 0) {
      newErrors.metrics = 'Add at least one metric';
    }
    for (const metric of metrics) {
      if (!metric.config.weight || metric.config.weight <= 0) {
        newErrors[`weight_${metric.key}`] = `${AVAILABLE_METRICS[metric.key].label} weight must be greater than 0`;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildRuleConfig = (): RuleConfig => ({
    metrics: metrics.reduce((acc, m) => ({ ...acc, [m.key]: m.config }), {}),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        const data: CreateRuleData = {
          name: name.trim(),
          description: description.trim(),
          user_id: userId,
          rule_config: buildRuleConfig(),
        };
        await valuationRuleService.createRule(data);
      } else if (mode === 'edit' && ruleId) {
        const data: UpdateRuleData = {
          name: name.trim(),
          description: description.trim(),
          rule_config: buildRuleConfig(),
        };
        await valuationRuleService.updateRule(ruleId, userId, data);
      }

      router.push('/valuation-rules');
    } catch (err: any) {
      console.error('Error saving rule:', err);
      const message = err.response?.data?.detail || 'Failed to save rule. Please try again.';
      setErrors({ submit: message });
      setIsSubmitting(false);
    }
  };

  const handleAddMetric = () => {
    if (!selectedMetric) return;
    if (metrics.some((m) => m.key === selectedMetric)) return;
    setMetrics([
      ...metrics,
      { key: selectedMetric, config: AVAILABLE_METRICS[selectedMetric].defaultConfig },
    ]);
    setSelectedMetric('');
  };

  const handleUpdateMetric = (index: number, config: MetricConfig) => {
    const updated = [...metrics];
    updated[index] = { ...updated[index], config };
    setMetrics(updated);
  };

  const handleRemoveMetric = (index: number) => {
    setMetrics(metrics.filter((_, i) => i !== index));
  };

  const availableToAdd = Object.entries(AVAILABLE_METRICS).filter(
    ([key]) => !metrics.some((m) => m.key === key)
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <form onSubmit={handleSubmit}>
        <div className="p-6 space-y-6">
          <div>
            <label htmlFor="ruleName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Rule Name*
            </label>
            <input
              type="text"
              id="ruleName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700`}
              required
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="ruleDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              id="ruleDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Metrics</h3>
            {metrics.map((metric, index) => (
              <MetricEditor
                key={metric.key}
                metricKey={metric.key}
                label={AVAILABLE_METRICS[metric.key].label}
                config={metric.config}
                onChange={(config) => handleUpdateMetric(index, config)}
                onRemove={() => handleRemoveMetric(index)}
              />
            ))}
            {errors.metrics && <p className="mt-1 text-sm text-red-600">{errors.metrics}</p>}

            {availableToAdd.length > 0 && (
              <div className="flex items-end space-x-2 mt-4">
                <div className="flex-grow">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Add Metric
                  </label>
                  <select
                    value={selectedMetric}
                    onChange={(e) => setSelectedMetric(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                  >
                    <option value="">Select a metric...</option>
                    {availableToAdd.map(([key, { label }]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleAddMetric}
                  disabled={!selectedMetric}
                  className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-2 px-4 rounded-md disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          {errors.submit && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400">
              {errors.submit}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Link
              href="/valuation-rules"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Rule' : 'Update Rule'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
