import api from './api';

export interface Alert {
  id: number;
  ticker: string;
  type: 'price' | 'volume' | 'valuation_score';
  threshold: number;
  condition: 'above' | 'below';
  is_active: boolean;
  created_at: string;
  triggered_at?: string;
}

export interface CreateAlertData {
  ticker: string;
  type: 'price' | 'volume' | 'valuation_score';
  threshold: number;
  condition: 'above' | 'below';
}

export interface UpdateAlertData {
  threshold?: number;
  condition?: 'above' | 'below';
  is_active?: boolean;
}

const alertService = {
  getAlerts: async () => {
    const response = await api.get<Alert[]>('/report-service/alerts');
    return response.data;
  },

  getAlert: async (alertId: number) => {
    const response = await api.get<Alert>(`/report-service/alerts/${alertId}`);
    return response.data;
  },

  createAlert: async (data: CreateAlertData) => {
    const response = await api.post<Alert>('/report-service/alerts/set', data);
    return response.data;
  },

  updateAlert: async (alertId: number, data: UpdateAlertData) => {
    const response = await api.put<Alert>(`/report-service/alerts/${alertId}`, data);
    return response.data;
  },

  deleteAlert: async (alertId: number) => {
    await api.delete(`/report-service/alerts/${alertId}`);
  },

  getTriggeredAlerts: async () => {
    const response = await api.get<Alert[]>('/report-service/alerts/triggered');
    return response.data;
  },

  markAlertAsRead: async (alertId: number) => {
    await api.post(`/report-service/alerts/${alertId}/read`);
  },

  toggleAlert: async (alertId: number, isActive: boolean) => {
    const response = await api.put<Alert>(`/report-service/alerts/${alertId}`, {
      is_active: isActive,
    });
    return response.data;
  },
};

export default alertService;