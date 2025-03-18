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
}

const reportService = {
  getReports: async () => {
    const response = await api.get<Report[]>('/report-service/reports');
    return response.data;
  },

  getReport: async (reportId: number) => {
    const response = await api.get<Report>(`/report-service/reports/${reportId}`);
    return response.data;
  },

  generatePortfolioReport: async (portfolioId: number, title?: string) => {
    const data: ReportRequest = {
      title: title || `Portfolio Report ${new Date().toISOString().split('T')[0]}`,
      type: 'portfolio',
      target_id: portfolioId,
    };
    const response = await api.post<Report>('/report-service/reports/generate', data);
    return response.data;
  },

  generateBasketReport: async (basketId: number, title?: string) => {
    const data: ReportRequest = {
      title: title || `Basket Report ${new Date().toISOString().split('T')[0]}`,
      type: 'basket',
      target_id: basketId,
    };
    const response = await api.post<Report>('/report-service/reports/generate', data);
    return response.data;
  },

  downloadReport: async (reportId: number) => {
    const response = await api.get<Blob>(`/report-service/reports/${reportId}/download`, {
      responseType: 'blob',
    });
    
    // Create a URL for the blob and trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `report-${reportId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
  },

  deleteReport: async (reportId: number) => {
    await api.delete(`/report-service/reports/${reportId}`);
  },
};

export default reportService;