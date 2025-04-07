import api from './api';

export interface Portfolio {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  total_value?: number;
  daily_change?: number;
  stocks_count?: number;
  performance?: {
    day: number;
    week: number;
    month: number;
    year: number;
    all_time: number;
  };
}

export interface PortfolioHolding {
  id: number;
  ticker: string;
  shares: number;
  cost_basis: number | null;
  purchase_date: string | null;
  notes: string | null;
  current_price?: number;
  current_value?: number;
  change_percent?: number;
  change_value?: number;
  weight?: number; // percent of portfolio
  name?: string;
  sector?: string;
}

export interface CreatePortfolioData {
  name: string;
  description?: string;
}

export interface UpdatePortfolioData {
  name?: string;
  description?: string;
}

export interface CreateHoldingData {
  ticker: string;
  shares: number;
  cost_basis?: number;
  purchase_date?: string;
  notes?: string;
}

export interface UpdateHoldingData {
  shares?: number;
  cost_basis?: number;
  purchase_date?: string;
  notes?: string;
}

const portfolioService = {
  getPortfolios: async () => {
    const response = await api.get<Portfolio[]>('/user-service/users/portfolio');
    return response.data;
  },

  getPortfolio: async (portfolioId: number) => {
    const response = await api.get<Portfolio>(`/user-service/users/portfolio/${portfolioId}`);
    return response.data;
  },

  createPortfolio: async (data: CreatePortfolioData) => {
    const response = await api.post<Portfolio>('/user-service/users/portfolio', data);
    return response.data;
  },

  updatePortfolio: async (portfolioId: number, data: UpdatePortfolioData) => {
    const response = await api.put<Portfolio>(`/user-service/users/portfolio/${portfolioId}`, data);
    return response.data;
  },

  deletePortfolio: async (portfolioId: number) => {
    await api.delete(`/user-service/users/portfolio/${portfolioId}`);
  },

  getHoldings: async (portfolioId: number) => {
    const response = await api.get<PortfolioHolding[]>(`/user-service/users/portfolio/${portfolioId}/holding`);
    return response.data;
  },

  addHolding: async (portfolioId: number, data: CreateHoldingData) => {
    const response = await api.post<PortfolioHolding>(`/user-service/users/portfolio/${portfolioId}/holding`, data);
    return response.data;
  },

  updateHolding: async (portfolioId: number, holdingId: number, data: UpdateHoldingData) => {
    const response = await api.put<PortfolioHolding>(`/user-service/users/portfolio/${portfolioId}/holding/${holdingId}`, data);
    return response.data;
  },

  deleteHolding: async (portfolioId: number, holdingId: number) => {
    await api.delete(`/user-service/users/portfolio/${portfolioId}/holding/${holdingId}`);
  },
};

export default portfolioService;
