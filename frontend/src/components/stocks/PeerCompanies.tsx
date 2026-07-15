"use client";

import Link from 'next/link';
import { PeerCompany } from '@/services/stockService';

interface PeerCompaniesProps {
  peers: PeerCompany[];
}

export default function PeerCompanies({ peers }: PeerCompaniesProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Peer Companies</h2>
      {peers.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ticker</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Market Cap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {peers.slice(0, 5).map((peer) => (
                <tr key={peer.ticker} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-3 py-2 whitespace-nowrap">
                    <Link href={`/stocks/${peer.ticker}`} className="text-primary-600 dark:text-primary-400 hover:underline">
                      {peer.ticker}
                    </Link>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{peer.name}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {peer.market_cap ? `$${(peer.market_cap / 1000000000).toFixed(2)}B` : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">No peer companies available</p>
      )}
    </div>
  );
}
