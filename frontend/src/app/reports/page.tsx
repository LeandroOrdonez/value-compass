"use client";

import { useState, useEffect } from 'react';
import reportService, { Report } from '@/services/reportService';
import portfolioService from '@/services/portfolioService';
import basketService from '@/services/basketService';

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [baskets, setBaskets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'portfolio' | 'basket'>('portfolio');
  const [selectedTargetId, setSelectedTargetId] = useState<number | null>(null);
  const [reportTitle, setReportTitle] = useState('');
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Check if user is authenticated
        if (!localStorage.getItem('token')) {
          setError('Please sign in to view reports.');
          setLoading(false);
          return;
        }
        
        // Fetch data in parallel
        const [reportsData, portfoliosData, basketsData] = await Promise.all([
          reportService.getReports(),
          portfolioService.getPortfolios(),
          basketService.getBaskets()
        ]);
        
        setReports(reportsData);
        setPortfolios(portfoliosData);
        setBaskets(basketsData);
        
        // Set default selection if available
        if (portfoliosData.length > 0) {
          setSelectedTargetId(portfoliosData[0].id);
        } else if (basketsData.length > 0) {
          setSelectedType('basket');
          setSelectedTargetId(basketsData[0].id);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching reports data:', err);
        setError('Failed to load reports data. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleGenerateReport = async () => {
    if (!selectedTargetId) return;
    
    try {
      setGeneratingReport(true);
      
      let newReport;
      if (selectedType === 'portfolio') {
        newReport = await reportService.generatePortfolioReport(selectedTargetId, reportTitle || undefined);
      } else {
        newReport = await reportService.generateBasketReport(selectedTargetId, reportTitle || undefined);
      }
      
      setReports([newReport, ...reports]);
      setReportTitle('');
      setGeneratingReport(false);
    } catch (err) {
      console.error('Error generating report:', err);
      alert('Failed to generate report. Please try again.');
      setGeneratingReport(false);
    }
  };

  const handleDownloadReport = async (reportId: number) => {
    try {
      await reportService.downloadReport(reportId);
    } catch (err) {
      console.error('Error downloading report:', err);
      alert('Failed to download report. Please try again.');
    }
  };

  const handleDeleteReport = async (reportId: number) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      try {
        await reportService.deleteReport(reportId);
        setReports(reports.filter(report => report.id !== reportId));
      } catch (err) {
        console.error('Error deleting report:', err);
        alert('Failed to delete report. Please try again.');
      }
    }
  };

  const getTargetName = (report: Report) => {
    if (report.type === 'portfolio') {
      const portfolio = portfolios.find(p => p.id === report.target_id);
      return portfolio ? portfolio.name : `Portfolio #${report.target_id}`;
    } else {
      const basket = baskets.find(b => b.id === report.target_id);
      return basket ? basket.name : `Basket #${report.target_id}`;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Reports</h1>
        <div className="animate-pulse">
          <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Reports</h1>
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
        <button 
          className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  const noTargetsAvailable = portfolios.length === 0 && baskets.length === 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Reports</h1>
      
      {/* Generate Report Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Generate New Report</h2>
        
        {noTargetsAvailable ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4">
            <p className="text-yellow-700 dark:text-yellow-300">
              You need to create a portfolio or basket first before generating reports.
            </p>
          </div>
        ) : (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleGenerateReport();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Report Type
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-primary-600"
                    value="portfolio"
                    checked={selectedType === 'portfolio'}
                    onChange={() => {
                      setSelectedType('portfolio');
                      if (portfolios.length > 0) {
                        setSelectedTargetId(portfolios[0].id);
                      } else {
                        setSelectedTargetId(null);
                      }
                    }}
                    disabled={portfolios.length === 0}
                  />
                  <span className="ml-2">Portfolio Report</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-primary-600"
                    value="basket"
                    checked={selectedType === 'basket'}
                    onChange={() => {
                      setSelectedType('basket');
                      if (baskets.length > 0) {
                        setSelectedTargetId(baskets[0].id);
                      } else {
                        setSelectedTargetId(null);
                      }
                    }}
                    disabled={baskets.length === 0}
                  />
                  <span className="ml-2">Basket Report</span>
                </label>
              </div>
            </div>
            
            <div>
              <label htmlFor="targetSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {selectedType === 'portfolio' ? 'Select Portfolio' : 'Select Basket'}
              </label>
              <select
                id="targetSelect"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                value={selectedTargetId || ''}
                onChange={(e) => setSelectedTargetId(Number(e.target.value))}
                required
              >
                {selectedType === 'portfolio' ? (
                  portfolios.map(portfolio => (
                    <option key={portfolio.id} value={portfolio.id}>
                      {portfolio.name}
                    </option>
                  ))
                ) : (
                  baskets.map(basket => (
                    <option key={basket.id} value={basket.id}>
                      {basket.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            
            <div>
              <label htmlFor="reportTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Report Title (Optional)
              </label>
              <input
                type="text"
                id="reportTitle"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                placeholder="Enter custom title for the report"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded flex items-center"
                disabled={!selectedTargetId || generatingReport}
              >
                {generatingReport ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  'Generate Report'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
      
      {/* Reports List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold">Your Reports</h2>
        </div>
        
        {reports.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No reports generated yet. Use the form above to create your first report.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {reports.map((report) => (
              <li key={report.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                  <div className="mb-2 md:mb-0">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{report.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {report.type === 'portfolio' ? 'Portfolio' : 'Basket'}: {getTargetName(report)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Generated: {new Date(report.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                      ${report.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' : 
                        report.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' : 
                        'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'}`}
                    >
                      {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                    </span>
                    
                    {report.status === 'completed' && (
                      <button
                        onClick={() => handleDownloadReport(report.id)}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
                      >
                        Download
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDeleteReport(report.id)}
                      className="text-red-600 hover:text-red-800 dark:hover:text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}