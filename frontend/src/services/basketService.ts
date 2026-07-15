import api from './api';

export interface Basket {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface BasketStock {
  id: number;
  ticker: string;
  description: string | null;
  added_at: string;
}

export interface CreateBasketData {
  name: string;
  description?: string;
}

export interface UpdateBasketData {
  name?: string;
  description?: string;
}

export interface AddStockData {
  ticker: string;
  description?: string;
}

export interface BasketValuationScore {
  ticker: string;
  value_score: number;
  growth_score: number;
  quality_score: number;
  overall_score: number;
  score_components: Record<string, number>;
}

export interface BasketValuationSummary {
  avg_value_score: number;
  avg_growth_score: number;
  avg_quality_score: number;
  avg_overall_score: number;
}

export interface BasketValuationResult {
  scores: BasketValuationScore[];
  summary: BasketValuationSummary;
}

const VALUE_METRICS = ['pe_ratio', 'pb_ratio', 'dividend_yield', 'debt_to_equity', 'peer_pe_ratio', 'peer_pb_ratio'];
const GROWTH_METRICS = ['roe', 'profit_margin'];
const QUALITY_METRICS = ['historical_volatility'];

const average = (values: number[]): number => {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
};

const categoryScore = (components: Record<string, number>, metrics: string[], overall: number): number => {
  const values = metrics.filter((m) => m in components).map((m) => components[m]);
  if (values.length === 0) return overall;
  return average(values);
};

const basketService = {
  getBaskets: async () => {
    const response = await api.get<Basket[]>('/user-service/users/customBaskets');
    return response.data;
  },

  getBasket: async (basketId: number) => {
    const response = await api.get<Basket>(`/user-service/users/customBaskets/${basketId}`);
    return response.data;
  },

  createBasket: async (data: CreateBasketData) => {
    const response = await api.post<Basket>('/user-service/users/customBaskets', data);
    return response.data;
  },

  updateBasket: async (basketId: number, data: UpdateBasketData) => {
    const response = await api.put<Basket>(`/user-service/users/customBaskets/${basketId}`, data);
    return response.data;
  },

  deleteBasket: async (basketId: number) => {
    await api.delete(`/user-service/users/customBaskets/${basketId}`);
  },

  getStocks: async (basketId: number) => {
    const response = await api.get<BasketStock[]>(`/user-service/users/customBaskets/${basketId}/stocks`);
    return response.data;
  },

  addStock: async (basketId: number, data: AddStockData) => {
    const response = await api.post<BasketStock>(`/user-service/users/customBaskets/${basketId}/stocks`, data);
    return response.data;
  },

  removeStock: async (basketId: number, stockId: number) => {
    await api.delete(`/user-service/users/customBaskets/${basketId}/stocks/${stockId}`);
  },

  getValuationScores: async (basketId: number, ruleId?: number): Promise<BasketValuationResult> => {
    // First fetch the basket's stocks to get tickers
    const stocks = await basketService.getStocks(basketId);
    const tickers = stocks.map((s: BasketStock) => s.ticker);

    if (tickers.length === 0) {
      return {
        scores: [],
        summary: { avg_value_score: 0, avg_growth_score: 0, avg_quality_score: 0, avg_overall_score: 0 },
      };
    }

    // Use the batch valuation endpoint with the tickers
    const params: Record<string, string> = {};
    if (ruleId) {
      params.rule_id = ruleId.toString();
    }
    const response = await api.post<Array<{
      ticker: string;
      score: number;
      score_components: Record<string, number>;
      error?: string;
    }>>('/valuation-service/valuation/batch', tickers, { params });

    const scores = response.data
      .filter((item) => !item.error)
      .map((item) => {
        const overall = item.score ?? 0;
        const components = item.score_components ?? {};
        return {
          ticker: item.ticker,
          value_score: categoryScore(components, VALUE_METRICS, overall),
          growth_score: categoryScore(components, GROWTH_METRICS, overall),
          quality_score: categoryScore(components, QUALITY_METRICS, overall),
          overall_score: overall,
          score_components: components,
        };
      });

    return {
      scores,
      summary: {
        avg_value_score: average(scores.map((s) => s.value_score)),
        avg_growth_score: average(scores.map((s) => s.growth_score)),
        avg_quality_score: average(scores.map((s) => s.quality_score)),
        avg_overall_score: average(scores.map((s) => s.overall_score)),
      },
    };
  },
};

export default basketService;