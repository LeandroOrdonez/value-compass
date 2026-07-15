"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import portfolioService, { Portfolio, PortfolioHolding } from '@/services/portfolioService';
import stockService, { StockFinancialData, StockHistoricalData } from '@/services/stockService';

export type Timeframe = '1m' | '3m' | '6m' | '1y' | '5y';

export interface PerformanceData {
  dates: string[];
  values: number[];
}

export interface PortfolioMetrics {
  portfolio: Portfolio | null;
  holdings: PortfolioHolding[];
  performanceData: PerformanceData;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

interface HoldingWithData {
  holding: PortfolioHolding;
  financialData: StockFinancialData | null;
  historicalData: StockHistoricalData[];
}

const DISPLAY_DAYS: Record<Timeframe, number> = {
  '1m': 30,
  '3m': 90,
  '6m': 180,
  '1y': 365,
  '5y': 365 * 5,
};

const formatDate = (date: Date) => date.toLocaleDateString('en-CA');

const average = (values: number[]): number => {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
};

export function usePortfolioData(portfolioId: number, timeframe: Timeframe): PortfolioMetrics {
  const [portfolioData, setPortfolioData] = useState<Portfolio | null>(null);
  const [holdingsWithData, setHoldingsWithData] = useState<HoldingWithData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [portfolioResponse, holdingsResponse] = await Promise.all([
        portfolioService.getPortfolio(portfolioId),
        portfolioService.getHoldings(portfolioId),
      ]);

      if (holdingsResponse.length === 0) {
        setPortfolioData({
          ...portfolioResponse,
          total_value: 0,
          daily_change: 0,
          stocks_count: 0,
          performance: { day: 0, week: 0, month: 0, year: 0, all_time: 0 },
        });
        setHoldingsWithData([]);
        setLoading(false);
        return;
      }

      const today = new Date();
      const endDate = formatDate(today);
      const fetchStart = new Date(today);
      fetchStart.setDate(fetchStart.getDate() - DISPLAY_DAYS['5y']);
      const fetchStartDate = formatDate(fetchStart);

      const enriched = await Promise.all(
        holdingsResponse.map(async (holding) => {
          try {
            const [financialData, historicalData] = await Promise.all([
              stockService.getFinancialData(holding.ticker),
              stockService.getHistoricalData(holding.ticker, fetchStartDate, endDate),
            ]);
            const sortedData = historicalData.sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            );
            return { holding, financialData, historicalData: sortedData };
          } catch (err) {
            console.error(`Error fetching data for ${holding.ticker}:`, err);
            return { holding, financialData: null as StockFinancialData | null, historicalData: [] };
          }
        })
      );

      setHoldingsWithData(enriched);
      setPortfolioData(portfolioResponse);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching portfolio data:', err);
      setError('Failed to load portfolio data. Please try again later.');
      setLoading(false);
    }
  }, [portfolioId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const computed = useMemo(() => {
    if (!portfolioData || holdingsWithData.length === 0) {
      return {
        portfolio: portfolioData,
        holdings: [] as PortfolioHolding[],
        performanceData: { dates: [], values: [] } as PerformanceData,
      };
    }

    const today = new Date();
    const endDate = formatDate(today);
    const displayStart = new Date(today);
    displayStart.setDate(displayStart.getDate() - DISPLAY_DAYS[timeframe]);
    const displayStartDate = formatDate(displayStart);

    const currentMetrics = holdingsWithData.map(({ holding, financialData, historicalData }) => {
      const shares = holding.shares || 0;
      const costBasis = holding.cost_basis || 0;
      const name = financialData?.name || holding.ticker;
      const sector = financialData?.sector || 'Other';
      const currentPrice = historicalData.length > 0 ? historicalData[historicalData.length - 1].close : 0;
      const previousClose = historicalData.length > 1 ? historicalData[historicalData.length - 2].close : currentPrice;
      const currentValue = currentPrice * shares;
      const dailyChangePercent = previousClose > 0 ? ((currentPrice - previousClose) / previousClose) * 100 : 0;
      const changePercent = costBasis > 0 ? (currentPrice / costBasis - 1) * 100 : dailyChangePercent;
      const changeValue = costBasis > 0 ? currentValue - costBasis * shares : 0;

      return {
        ...holding,
        name,
        sector,
        current_price: currentPrice,
        previous_close: previousClose,
        current_value: currentValue,
        change_percent: changePercent,
        change_value: changeValue,
        weight: 0,
      };
    });

    const totalValue = currentMetrics.reduce((sum, h) => sum + (h.current_value || 0), 0);
    const totalCostBasis = currentMetrics.reduce(
      (sum, h) => sum + ((h.cost_basis || 0) * (h.shares || 0)),
      0
    );

    const enrichedHoldings = currentMetrics.map((h) => ({
      ...h,
      weight: totalValue > 0 ? ((h.current_value || 0) / totalValue) * 100 : 0,
    }));

    // Build daily performance chart from the selected display window
    const dateRange: string[] = [];
    const d = new Date(displayStartDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    while (d <= end) {
      dateRange.push(formatDate(d));
      d.setDate(d.getDate() + 1);
    }

    const holdingPrices = holdingsWithData.map(({ holding, historicalData }) => {
      const map = new Map<string, number>();
      historicalData.forEach((point) => map.set(point.date, point.close));
      const sortedDates = Array.from(map.keys()).sort();
      return { shares: holding.shares || 0, sortedDates, map };
    });

    const values: number[] = [];
    for (const date of dateRange) {
      let total = 0;
      for (const hp of holdingPrices) {
        let price: number | undefined;
        for (let i = hp.sortedDates.length - 1; i >= 0; i--) {
          if (hp.sortedDates[i] <= date) {
            price = hp.map.get(hp.sortedDates[i]);
            break;
          }
        }
        if (price !== undefined) {
          total += price * hp.shares;
        }
      }
      values.push(total);
    }

    const dates = dateRange.map((date) => new Date(date + 'T00:00:00').toLocaleDateString());

    const performance = {
      day: 0,
      week: 0,
      month: 0,
      year: 0,
      all_time: 0,
    };

    const len = values.length;
    if (len > 1 && values[len - 2] > 0) {
      performance.day = ((values[len - 1] / values[len - 2]) - 1) * 100;
    }
    if (len > 5 && values[len - 6] > 0) {
      performance.week = ((values[len - 1] / values[len - 6]) - 1) * 100;
    }
    if (len > 30 && values[len - 31] > 0) {
      performance.month = ((values[len - 1] / values[len - 31]) - 1) * 100;
    }
    if (len > 365 && values[len - 366] > 0) {
      performance.year = ((values[len - 1] / values[len - 366]) - 1) * 100;
    }
    if (totalCostBasis > 0) {
      performance.all_time = ((totalValue / totalCostBasis) - 1) * 100;
    }

    (Object.keys(performance) as (keyof typeof performance)[]).forEach((key) => {
      if (!isFinite(performance[key])) {
        performance[key] = 0;
      }
    });

    const portfolio: Portfolio = {
      ...portfolioData,
      total_value: totalValue,
      daily_change: performance.day,
      stocks_count: enrichedHoldings.length,
      performance,
    };

    return {
      portfolio,
      holdings: enrichedHoldings,
      performanceData: { dates, values },
    };
  }, [portfolioData, holdingsWithData, timeframe]);

  return {
    portfolio: computed.portfolio,
    holdings: computed.holdings,
    performanceData: computed.performanceData,
    loading,
    error,
    refresh: fetchData,
  };
}
