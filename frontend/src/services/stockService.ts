import api from './api';

export interface StockHistoricalData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjusted_close: number;
}

export interface StockFinancialData {
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  pe_ratio: number | null;
  pb_ratio: number | null;
  dividend_yield: number | null;
  market_cap: number | null;
  eps: number | null;
  revenue: number | null;
  profit_margin: number | null;
  debt_to_equity: number | null;
  roe: number | null;
  current_ratio: number | null;
}

export interface PeerCompany {
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  market_cap: number | null;
}

export interface SearchResult {
  ticker: string;
  name: string;
  sector?: string;
  industry?: string;
  market_cap?: number | null;
  price?: number | null;
  currency?: string;
  exchange?: string;
  country?: string;
  logo_url?: string;
  website?: string;
  pe_ratio?: number | null;
  dividend_yield?: number | null;
  '52week_high'?: number | null;
  '52week_low'?: number | null;
  // ETF specific fields
  asset_class?: string;
  category?: string;
  expense_ratio?: number | null;
  yield?: number | null;
  // Trending stocks fields
  change_percent?: string;
  is_trending?: boolean;
}

export interface ValuationScore {
  ticker: string;
  rule_name: string;
  score: number;
  score_components: Record<string, number>;
}

export interface StockDetails extends StockFinancialData {
  current_price: number | null;
  previous_close: number | null;
  change_percent: string | null;
  last_updated: string;
}

const stockService = {
  getHistoricalData: async (ticker: string, startDate?: string, endDate?: string) => {
    let url = `/data-service/stocks/${ticker}/historical`;
    const params: Record<string, string> = {};
    
    if (startDate) {
      params.start_date = startDate;
    }
    
    if (endDate) {
      params.end_date = endDate;
    }
    
    const response = await api.get<StockHistoricalData[]>(url, { params });
    return response.data;
  },

  getFinancialData: async (ticker: string) => {
    const response = await api.get<StockFinancialData>(`/data-service/stocks/${ticker}/financials`);
    return response.data;
  },

  getPeerCompanies: async (industry: string) => {
    const response = await api.get<PeerCompany[]>(`/data-service/industry/${industry}/peers`);
    return response.data;
  },

  getValuationScore: async (ticker: string, ruleId?: number) => {
    let url = `/valuation-service/valuation/score?ticker=${ticker}`;
    if (ruleId) {
      url += `&rule_id=${ruleId}`;
    }
    
    const response = await api.post<ValuationScore>(url);
    return response.data;
  },

  getValuationScoresBatch: async (tickers: string[], ruleId?: number) => {
    let url = '/valuation-service/valuation/batch';
    const params: Record<string, string> = {};
    
    if (ruleId) {
      params.rule_id = ruleId.toString();
    }
    
    const response = await api.post<ValuationScore[]>(url, tickers, { params });
    return response.data;
  },

  searchStocks: async (query: string, limit: number = 10) => {
    try {
      const response = await api.get<SearchResult[]>(
        `/data-service/industry/search?query=${encodeURIComponent(query)}&limit=${limit}`, 
        {
          timeout: 15000  // 15 seconds should be sufficient for search
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error searching stocks:", error);
      // Return empty array instead of throwing error to prevent UI crashes
      return [];
    }
  },
  
  getTrendingStocks: async (count: number = 5) => {
    try {
      const response = await api.get<SearchResult[]>(`/data-service/industry/trending?count=${count}`, {
        timeout: 30000  // Increase timeout to 30 seconds
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching trending stocks:", error);
      // Return empty array instead of throwing error to prevent dashboard crash
      return [];
    }
  },

  getStockDetails: async (ticker: string) => {
    try {
      // First, try to get financial data which includes most details
      const financialData = await stockService.getFinancialData(ticker);
      
      // For price data, we need to get the latest price from historical data
      const historicalData = await stockService.getHistoricalData(ticker);
      
      // Get the most recent closing price and calculate change percentage
      let currentPrice = null;
      let changePercent = null;
      let previousClose = null;
      
      if (historicalData && historicalData.length > 1) {
        const latestData = historicalData[historicalData.length - 1];
        const previousData = historicalData[historicalData.length - 2];
        
        currentPrice = latestData.close;
        previousClose = previousData.close;
        
        // Calculate change percentage
        if (previousClose > 0) {
          changePercent = ((currentPrice - previousClose) / previousClose * 100).toFixed(2);
        }
      }
      
      return {
        ...financialData,
        current_price: currentPrice,
        previous_close: previousClose,
        change_percent: changePercent,
        last_updated: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error fetching stock details:", error);
      throw error;
    }
  },
};

export default stockService;