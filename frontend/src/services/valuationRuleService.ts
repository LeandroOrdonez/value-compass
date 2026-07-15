import api from './api';

export interface ValuationRule {
  id: number;
  name: string;
  description: string;
  is_default: boolean;
  user_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface RuleConfig {
  metrics: Record<string, MetricConfig>;
}

export interface MetricConfig {
  weight: number;
  ideal_range?: number[];
  max_pe?: number;
  max_pb?: number;
  max_yield?: number;
  max_ratio?: number;
  max_volatility?: number;
  max_roe?: number;
  default_score?: number;
  negative_score?: number;
  zero_score?: number;
  unsustainable_score?: number;
}

export interface CreateRuleData {
  name: string;
  description: string;
  user_id: number;
  rule_config: RuleConfig;
}

export interface UpdateRuleData {
  name?: string;
  description?: string;
  rule_config?: RuleConfig;
}

export const AVAILABLE_METRICS: Record<string, { label: string; defaultConfig: MetricConfig }> = {
  pe_ratio: {
    label: 'P/E Ratio',
    defaultConfig: {
      weight: 1,
      ideal_range: [5, 15],
      max_pe: 50,
      default_score: 50,
      negative_score: 20,
    },
  },
  pb_ratio: {
    label: 'P/B Ratio',
    defaultConfig: {
      weight: 1,
      ideal_range: [0.5, 2.0],
      max_pb: 10,
      default_score: 50,
      negative_score: 20,
    },
  },
  dividend_yield: {
    label: 'Dividend Yield',
    defaultConfig: {
      weight: 1,
      ideal_range: [2.0, 6.0],
      max_yield: 15,
      default_score: 50,
      zero_score: 40,
      unsustainable_score: 50,
    },
  },
  debt_to_equity: {
    label: 'Debt-to-Equity',
    defaultConfig: {
      weight: 1,
      ideal_range: [0, 1.0],
      max_ratio: 3,
      default_score: 50,
      negative_score: 10,
    },
  },
  profit_margin: {
    label: 'Profit Margin',
    defaultConfig: {
      weight: 1,
      ideal_range: [10.0, 25.0],
      default_score: 50,
    },
  },
  roe: {
    label: 'Return on Equity',
    defaultConfig: {
      weight: 1,
      ideal_range: [10.0, 20.0],
      default_score: 50,
    },
  },
  historical_volatility: {
    label: 'Historical Volatility',
    defaultConfig: {
      weight: 1,
      ideal_range: [10.0, 25.0],
      max_volatility: 50,
      default_score: 50,
    },
  },
  peer_pe_ratio: {
    label: 'Peer P/E Comparison',
    defaultConfig: {
      weight: 1,
      default_score: 50,
    },
  },
  peer_pb_ratio: {
    label: 'Peer P/B Comparison',
    defaultConfig: {
      weight: 1,
      default_score: 50,
    },
  },
};

const valuationRuleService = {
  getRules: async (userId: number): Promise<ValuationRule[]> => {
    const response = await api.get<ValuationRule[]>('/valuation-service/valuation/rules', {
      params: { user_id: userId },
    });
    return response.data;
  },

  getRule: async (ruleId: number, userId: number): Promise<ValuationRule & { rule_config?: RuleConfig }> => {
    const response = await api.get<ValuationRule & { rule_config?: RuleConfig }>(
      `/valuation-service/valuation/custom/${ruleId}`,
      { params: { user_id: userId } }
    );
    return response.data;
  },

  createRule: async (data: CreateRuleData): Promise<ValuationRule> => {
    const response = await api.post<ValuationRule>('/valuation-service/valuation/custom', data);
    return response.data;
  },

  updateRule: async (ruleId: number, userId: number, data: UpdateRuleData): Promise<ValuationRule> => {
    const response = await api.put<ValuationRule>(`/valuation-service/valuation/custom/${ruleId}`, data, {
      params: { user_id: userId },
    });
    return response.data;
  },

  deleteRule: async (ruleId: number, userId: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/valuation-service/valuation/custom/${ruleId}`, {
      params: { user_id: userId },
    });
    return response.data;
  },
};

export default valuationRuleService;
