"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import authService from '@/services/authService';
import valuationRuleService, { MetricConfig } from '@/services/valuationRuleService';
import RuleForm from '@/components/valuation-rules/RuleForm';

export default function EditValuationRulePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const ruleId = parseInt(unwrappedParams.id, 10);

  const [userId, setUserId] = useState<number | null>(null);
  const [ruleName, setRuleName] = useState('');
  const [ruleDescription, setRuleDescription] = useState('');
  const [initialMetrics, setInitialMetrics] = useState<{ key: string; config: MetricConfig }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRule = async () => {
      try {
        setLoading(true);
        const user = await authService.getCurrentUser();
        setUserId(user.id);

        const rule = await valuationRuleService.getRule(ruleId, user.id);
        setRuleName(rule.name);
        setRuleDescription(rule.description || '');

        if (rule.rule_config?.metrics) {
          setInitialMetrics(
            Object.entries(rule.rule_config.metrics).map(([key, config]) => ({
              key,
              config,
            }))
          );
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching rule:', err);
        setError('Failed to load valuation rule. It may not exist or you do not have permission to edit it.');
        setLoading(false);
      }
    };

    if (ruleId) {
      fetchRule();
    }
  }, [ruleId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !userId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/valuation-rules"
            className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Valuation Rules
          </Link>
        </div>
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <p>{error || 'Unable to edit rule.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/valuation-rules"
          className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 flex items-center"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Valuation Rules
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">Edit Custom Valuation Rule</h1>
      <RuleForm
        mode="edit"
        ruleId={ruleId}
        userId={userId}
        initialName={ruleName}
        initialDescription={ruleDescription}
        initialMetrics={initialMetrics}
      />
    </div>
  );
}
