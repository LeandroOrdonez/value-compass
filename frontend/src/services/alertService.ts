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
    // Get the current user ID from localStorage or auth context
    const userStr = localStorage.getItem('user');
    let userId = null;
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        userId = user.id;
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }
    
    if (!userId) {
      return []; // Return empty array if no user is logged in
    }
    
    const response = await api.get<any[]>(`/report-service/alerts/list?user_id=${userId}`);
    
    // Map the API response to match our frontend Alert interface
    return response.data.map(alert => ({
      id: alert.id,
      ticker: alert.ticker,
      type: alert.alert_type as 'price' | 'volume' | 'valuation_score',
      threshold: alert.threshold,
      condition: alert.parameters?.direction === 'above' ? 'above' : 'below',
      is_active: alert.is_active,
      created_at: alert.created_at,
      triggered_at: alert.last_triggered_at
    }));
  },

  getAlert: async (alertId: number) => {
    // Get all alerts and find the specific one
    const alerts = await alertService.getAlerts();
    const alert = alerts.find(a => a.id === alertId);
    
    if (!alert) {
      throw new Error(`Alert with ID ${alertId} not found`);
    }
    
    return alert;
  },

  createAlert: async (data: CreateAlertData) => {
    // Get the current user ID from localStorage or auth context
    const userStr = localStorage.getItem('user');
    let userId = null;
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        userId = user.id;
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }
    
    if (!userId) {
      throw new Error('User must be logged in to create alerts');
    }
    
    // Prepare data for the API
    const apiData = {
      user_id: userId,
      ticker: data.ticker,
      alert_type: data.type,
      threshold: data.threshold,
      parameters: {
        direction: data.condition
      }
    };
    
    const response = await api.post<any>('/report-service/alerts/set', apiData);
    
    // Map the API response to match our frontend Alert interface
    return {
      id: response.data.id,
      ticker: response.data.ticker,
      type: response.data.alert_type as 'price' | 'volume' | 'valuation_score',
      threshold: response.data.threshold,
      condition: data.condition, // Use the input data since API response might not include this
      is_active: response.data.is_active,
      created_at: response.data.created_at
    };
  },

  updateAlert: async (alertId: number, data: UpdateAlertData) => {
    // There is no direct endpoint for updating alerts in the API
    // For now, we'll toggle the alert if is_active is being updated
    if (data.is_active !== undefined) {
      const response = await api.put<any>(`/report-service/alerts/toggle/${alertId}`);
      
      // Map the API response to match our frontend Alert interface
      // We get a limited response from the toggle endpoint, so we need to fetch the full alert
      const alert = await alertService.getAlert(alertId);
      return alert;
    }
    
    // For other updates, we would need to implement this when the API supports it
    throw new Error('Updating alert thresholds or conditions is not supported by the API');
  },

  deleteAlert: async (alertId: number) => {
    await api.delete(`/report-service/alerts/delete/${alertId}`);
  },

  getTriggeredAlerts: async () => {
    // Get the current user ID from localStorage or auth context
    const userStr = localStorage.getItem('user');
    let userId = null;
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        userId = user.id;
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }
    
    if (!userId) {
      return []; // Return empty array if no user is logged in
    }
    
    // Use the correct endpoint with user ID and filter alerts that have been triggered
    const response = await api.get<Alert[]>(`/report-service/alerts/list?user_id=${userId}`);
    
    // Filter alerts that have been triggered (last_triggered_at is not null)
    const triggeredAlerts = response.data.filter(alert => alert.last_triggered_at);
    
    // Map the API response to match our frontend Alert interface
    return triggeredAlerts.map(alert => ({
      id: alert.id,
      ticker: alert.ticker,
      type: alert.alert_type as 'price' | 'volume' | 'valuation_score',
      threshold: alert.threshold,
      condition: alert.parameters?.direction === 'above' ? 'above' : 'below',
      is_active: alert.is_active,
      created_at: alert.created_at,
      triggered_at: alert.last_triggered_at
    }));
  },

  markAlertAsRead: async (alertId: number) => {
    // The API doesn't have a specific endpoint for marking alerts as read
    // For now, we'll use client-side only tracking in localStorage
    
    try {
      // Get already read alerts from localStorage
      const readAlertsStr = localStorage.getItem('readAlerts');
      let readAlerts: number[] = [];
      
      if (readAlertsStr) {
        readAlerts = JSON.parse(readAlertsStr);
      }
      
      // Add this alert if not already included
      if (!readAlerts.includes(alertId)) {
        readAlerts.push(alertId);
      }
      
      // Save back to localStorage
      localStorage.setItem('readAlerts', JSON.stringify(readAlerts));
    } catch (e) {
      console.error('Failed to mark alert as read:', e);
    }
  },

  toggleAlert: async (alertId: number, isActive: boolean) => {
    // Use the toggle endpoint which changes the active state
    const response = await api.put<any>(`/report-service/alerts/toggle/${alertId}`);
    
    // Map the API response to match our frontend Alert interface
    // We get a limited response from the toggle endpoint, so we need to fetch the full alert
    const alert = await alertService.getAlert(alertId);
    return alert;
  },
};

export default alertService;