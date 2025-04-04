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

  searchStocks: async (query: string) => {
    try {
      const response = await api.get<SearchResult[]>(`/data-service/industry/search?query=${encodeURIComponent(query)}`, {
        timeout: 30000  // Increase timeout to 30 seconds
      });
      return response.data;
    } catch (error) {
      console.error("Error searching stocks:", error);
      // Return empty array instead of throwing error to prevent dashboard crash
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
};

export default stockService;
