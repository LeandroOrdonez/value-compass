import api from './api';

export interface Report {
  id: number;
  title: string;
  type: 'portfolio' | 'basket';
  target_id: number;
  created_at: string;
  status: 'pending' | 'completed' | 'failed';
  file_url?: string;
}

export interface ReportRequest {
  title: string;
  type: 'portfolio' | 'basket';
  target_id: number;
  user_id: number;
  portfolio_id?: number;
  basket_id?: number;
}

const reportService = {
  getReports: async () => {
    try {
      // First try to get the current user from the API
      const userResponse = await api.get('/user-service/users/me');
      const userId = userResponse.data.id;
      
      // Then fetch reports with the user ID - use report-service path instead of direct /reports
      const response = await api.get<Report[]>('/report-service/reports/list', {
        params: {
          user_id: userId
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching reports:', error);
      return []; // Return empty array if not authenticated or error occurs
    }
  },

  getReport: async (reportId: number) => {
    const response = await api.get<Report>(`/report-service/reports/${reportId}`);
    return response.data;
  },

  generatePortfolioReport: async (portfolioId: number, title?: string) => {
    try {
      // First get the current user ID
      const userResponse = await api.get('/user-service/users/me');
      const userId = userResponse.data.id;
      
      const data = {
        title: title || `Portfolio Report ${new Date().toISOString().split('T')[0]}`,
        type: 'portfolio',
        target_id: portfolioId,
        user_id: userId,
        portfolio_id: portfolioId
      };
      const response = await api.post<Report>('/report-service/reports/generate', data);
      return response.data;
    } catch (error) {
      console.error('Error generating portfolio report:', error);
      throw error;
    }
  },

  generateBasketReport: async (basketId: number, title?: string) => {
    try {
      // First get the current user ID
      const userResponse = await api.get('/user-service/users/me');
      const userId = userResponse.data.id;
      
      const data = {
        title: title || `Basket Report ${new Date().toISOString().split('T')[0]}`,
        type: 'basket',
        target_id: basketId,
        user_id: userId,
        basket_id: basketId
      };
      const response = await api.post<Report>('/report-service/reports/generate', data);
      return response.data;
    } catch (error) {
      console.error('Error generating basket report:', error);
      throw error;
    }
  },

  downloadReport: async (reportId: number) => {
    // First get the report details with file URL
    const report = await api.get<Report>(`/report-service/reports/view/${reportId}`);
    
    if (!report.data.file_url) {
      throw new Error('Report file is not available');
    }
    
    // Create a link to the file URL and trigger download
    window.open(report.data.file_url, '_blank');
  },

  deleteReport: async (reportId: number) => {
    await api.delete(`/report-service/reports/delete/${reportId}`);
  },
};

export default reportService;