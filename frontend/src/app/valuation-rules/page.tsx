"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import authService from '@/services/authService';
import valuationRuleService, { ValuationRule } from '@/services/valuationRuleService';

export default function ValuationRulesPage() {
  const router = useRouter();
  const [rules, setRules] = useState<ValuationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    const fetchRules = async () => {
      try {
        setLoading(true);
        const user = await authService.getCurrentUser();
        setCurrentUserId(user.id);
        const data = await valuationRuleService.getRules(user.id);
        setRules(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching valuation rules:', err);
        setError('Failed to load valuation rules. Please try again later.');
        setLoading(false);
      }
    };

    fetchRules();
  }, []);

  const handleDelete = async (ruleId: number, ruleName: string) => {
    if (!currentUserId) return;
    if (!window.confirm(`Are you sure you want to delete the rule "${ruleName}"?`)) {
      return;
    }

    try {
      await valuationRuleService.deleteRule(ruleId, currentUserId);
      setRules(rules.filter((rule) => rule.id !== ruleId));
    } catch (err) {
      console.error('Error deleting rule:', err);
      setError('Failed to delete rule. Please try again.');
    }
  };

  const canManage = (rule: ValuationRule) => !rule.is_default && rule.user_id === currentUserId;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Valuation Rules</h1>
          <div className="h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Valuation Rules</h1>
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
        <button
          className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Valuation Rules</h1>
        <Link
          href="/valuation-rules/create"
          className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create Rule
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        {rules.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">No valuation rules found.</p>
            <Link
              href="/valuation-rules/create"
              className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
            >
              Create your first rule
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {rules.map((rule) => (
              <div key={rule.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{rule.name}</h3>
                      {rule.is_default && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          Default
                        </span>
                      )}
                      {rule.user_id === currentUserId && !rule.is_default && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          Custom
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{rule.description || 'No description'}</p>
                    <p className="text-gray-500 dark:text-gray-500 text-xs mt-2">
                      Created {new Date(rule.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {canManage(rule) && (
                      <>
                        <Link
                          href={`/valuation-rules/${rule.id}/edit`}
                          className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 font-medium text-sm px-3 py-1 border border-primary-600 dark:border-primary-400 rounded-md"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(rule.id, rule.name)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium text-sm px-3 py-1 border border-red-600 dark:border-red-400 rounded-md"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
