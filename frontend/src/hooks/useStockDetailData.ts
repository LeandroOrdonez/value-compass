"use client";

import { useState, useEffect, useMemo } from 'react';
import stockService, {
  StockHistoricalData,
  StockFinancialData,
  PeerCompany,
  ValuationScore,
} from '@/services/stockService';

export type Timeframe = '1m' | '3m' | '6m' | '1y' | '5y';

export interface StockDetailData {
  ticker: string;
  historicalData: StockHistoricalData[];
  fullHistoricalData: StockHistoricalData[];
  financialData: StockFinancialData | null;
  peerCompanies: PeerCompany[];
  valuationScore: ValuationScore | null;
  loading: boolean;
  error: string | null;
}

const DISPLAY_DAYS: Record<Timeframe, number> = {
  '1m': 30,
  '3m': 90,
  '6m': 180,
  '1y': 365,
  '5y': 365 * 5,
};

const formatDate = (date: Date) => date.toISOString().split('T')[0];

export function useStockDetailData(ticker: string, timeframe: Timeframe): StockDetailData {
  const [fullHistoricalData, setFullHistoricalData] = useState<StockHistoricalData[]>([]);
  const [financialData, setFinancialData] = useState<StockFinancialData | null>(null);
  const [peerCompanies, setPeerCompanies] = useState<PeerCompany[]>([]);
  const [valuationScore, setValuationScore] = useState<ValuationScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        setLoading(true);
        setError(null);

        const endDate = formatDate(new Date());
        const startDate = formatDate(new Date(Date.now() - DISPLAY_DAYS['5y'] * 24 * 60 * 60 * 1000));

        const [historicalResponse, financialResponse, valuationResponse] = await Promise.all([
          stockService.getHistoricalData(ticker, startDate, endDate),
          stockService.getFinancialData(ticker),
          stockService.getValuationScore(ticker),
        ]);

        setFullHistoricalData(historicalResponse);
        setFinancialData(financialResponse);
        setValuationScore(valuationResponse);

        if (financialResponse.industry) {
          try {
            const peersResponse = await stockService.getPeerCompanies(financialResponse.industry);
            setPeerCompanies(peersResponse.filter((peer) => peer.ticker !== ticker));
          } catch (peerErr) {
            console.error('Error fetching peer companies:', peerErr);
            setPeerCompanies([]);
          }
        } else {
          setPeerCompanies([]);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching stock data:', err);
        setError('Failed to load stock data. Please try again later.');
        setLoading(false);
      }
    };

    fetchStockData();
  }, [ticker]);

  const historicalData = useMemo(() => {
    const days = DISPLAY_DAYS[timeframe];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return fullHistoricalData
      .filter((point) => new Date(point.date) >= cutoff)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [fullHistoricalData, timeframe]);

  return {
    ticker,
    historicalData,
    fullHistoricalData,
    financialData,
    peerCompanies,
    valuationScore,
    loading,
    error,
  };
}
