"use client";

import { CreateHoldingData } from '@/services/portfolioService';

interface AddHoldingModalProps {
  isOpen: boolean;
  onClose: () => void;
  holding: CreateHoldingData;
  onChange: (holding: CreateHoldingData) => void;
  onSubmit: () => void;
}

export default function AddHoldingModal({
  isOpen,
  onClose,
  holding,
  onChange,
  onSubmit,
}: AddHoldingModalProps) {
  if (!isOpen) return null;

  const updateField = <K extends keyof CreateHoldingData>(
    field: K,
    value: CreateHoldingData[K]
  ) => {
    onChange({ ...holding, [field]: value });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Add New Holding</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ticker Symbol*
              </label>
              <input
                type="text"
                value={holding.ticker}
                onChange={(e) => updateField('ticker', e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                placeholder="e.g. AAPL"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Number of Shares*
              </label>
              <input
                type="number"
                value={holding.shares || ''}
                onChange={(e) => updateField('shares', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cost Basis (per share)
              </label>
              <input
                type="number"
                value={holding.cost_basis ?? ''}
                onChange={(e) => updateField('cost_basis', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                min="0"
                step="0.01"
                placeholder="e.g. 150.75"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Purchase Date
              </label>
              <input
                type="date"
                value={holding.purchase_date || ''}
                onChange={(e) => updateField('purchase_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                value={holding.notes || ''}
                onChange={(e) => updateField('notes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                rows={3}
                placeholder="Optional notes about this holding"
              ></textarea>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md font-medium"
            >
              Add Holding
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
