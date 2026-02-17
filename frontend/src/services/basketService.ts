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

  getValuationScores: async (basketId: number, ruleId?: number) => {
    // First fetch the basket's stocks to get tickers
    const stocks = await basketService.getStocks(basketId);
    const tickers = stocks.map((s: BasketStock) => s.ticker);

    if (tickers.length === 0) {
      return [];
    }

    // Use the batch valuation endpoint with the tickers
    const params: Record<string, string> = {};
    if (ruleId) {
      params.rule_id = ruleId.toString();
    }
    const response = await api.post('/valuation-service/valuation/batch', tickers, { params });
    return response.data;
  },
};

export default basketService;