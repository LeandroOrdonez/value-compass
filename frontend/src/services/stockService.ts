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
    const response = await api.get(`/data-service/industry/search?query=${encodeURIComponent(query)}`);
    return response.data;
  },
};

export default stockService;
