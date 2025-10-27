"use client";

import { useState, useEffect } from "react";

interface AnalyticsReportsProps {
  filters: {
    dateRange: { start: Date; end: Date };
    categories: number[];
    recipes: number[];
    period: "daily" | "weekly" | "monthly";
  };
}

interface CustomReport {
  id: number;
  name: string;
  description: string;
  reportType: string;
  isActive: boolean;
  lastRunAt: string | null;
  createdAt: string;
}

export function AnalyticsReports({ filters }: AnalyticsReportsProps) {
  const [reports, setReports] = useState<CustomReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newReport, setNewReport] = useState({
    name: "",
    description: "",
    reportType: "profitability",
    metrics: [] as string[],
    filters: {} as any,
    grouping: {} as any,
    dateRange: {} as any
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      // This would typically fetch from a reports API endpoint
      // For now, we'll simulate with empty data
      setReports([]);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const createReport = async () => {
    if (!newReport.name.trim()) return;

    try {
      const response = await fetch('/api/analytics/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newReport.name,
          description: newReport.description,
          reportType: newReport.reportType,
          metrics: newReport.metrics,
          filters: {
            ...filters,
            ...newReport.filters
          },
          grouping: newReport.grouping,
          dateRange: newReport.dateRange
        })
      });

      if (response.ok) {
        const result = await response.json();
        setReports([...reports, result.report]);
        setShowCreateForm(false);
        setNewReport({
          name: "",
          description: "",
          reportType: "profitability",
          metrics: [],
          filters: {},
          grouping: {},
          dateRange: {}
        });
      }
    } catch (error) {
      console.error('Failed to create report:', error);
    }
  };

  const generateReport = async (reportId: number) => {
    try {
      const response = await fetch(`/api/analytics/reports/generate?reportId=${reportId}`);
      if (response.ok) {
        const result = await response.json();
        // Handle the generated report data
        console.log('Generated report:', result);
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  };

  const exportReport = async (reportId: number, format: string) => {
    try {
      const response = await fetch(`/api/analytics/reports/export?reportId=${reportId}&format=${format}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${reportId}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-[var(--border)] rounded-lg p-4 sm:p-6 animate-pulse">
          <div className="h-6 bg-[var(--muted)] rounded mb-4"></div>
          <div className="h-32 bg-[var(--muted)] rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[var(--border)] rounded-lg p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Custom Reports</h3>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">Create, schedule, and export custom analytics reports</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-responsive-primary"
          >
            Create Report
          </button>
        </div>
      </div>

      {/* Create Report Form */}
      {showCreateForm && (
        <div className="bg-white border border-[var(--border)] rounded-lg p-4 sm:p-6">
          <h4 className="text-lg font-semibold text-[var(--foreground)] mb-4">Create New Report</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Report Name</label>
              <input
                type="text"
                value={newReport.name}
                onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                placeholder="Enter report name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Report Type</label>
              <select
                value={newReport.reportType}
                onChange={(e) => setNewReport({ ...newReport, reportType: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              >
                <option value="profitability">Profitability</option>
                <option value="trends">Trends</option>
                <option value="forecasting">Forecasting</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Description</label>
            <textarea
              value={newReport.description}
              onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              rows={3}
              placeholder="Enter report description"
            />
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={createReport}
              disabled={!newReport.name.trim()}
              className="btn-responsive-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Report
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 border border-[var(--border)] rounded-md text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Reports List */}
      <div className="bg-white border border-[var(--border)] rounded-lg p-4 sm:p-6">
        <h4 className="text-lg font-semibold text-[var(--foreground)] mb-4">Saved Reports</h4>
        
        {reports.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-[var(--muted-foreground)] mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h5 className="text-lg font-medium text-[var(--foreground)] mb-2">No Reports Yet</h5>
            <p className="text-[var(--muted-foreground)] mb-4">Create your first custom report to get started</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-responsive-primary"
            >
              Create Report
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="bg-[var(--muted)]/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-[var(--foreground)]">{report.name}</h5>
                    <p className="text-sm text-[var(--muted-foreground)] mt-1">{report.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-[var(--muted-foreground)]">
                      <span>Type: {report.reportType}</span>
                      <span>Created: {new Date(report.createdAt).toLocaleDateString()}</span>
                      {report.lastRunAt && (
                        <span>Last run: {new Date(report.lastRunAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => generateReport(report.id)}
                      className="px-3 py-1 border border-[var(--border)] rounded-md text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                    >
                      Generate
                    </button>
                    <div className="relative group">
                      <button className="px-3 py-1 border border-[var(--border)] rounded-md text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors">
                        Export
                      </button>
                      <div className="absolute right-0 top-full mt-1 bg-white border border-[var(--border)] rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button
                          onClick={() => exportReport(report.id, 'csv')}
                          className="block w-full px-3 py-2 text-left text-sm text-[var(--foreground)] hover:bg-[var(--muted)] rounded-t-lg"
                        >
                          Export as CSV
                        </button>
                        <button
                          onClick={() => exportReport(report.id, 'excel')}
                          className="block w-full px-3 py-2 text-left text-sm text-[var(--foreground)] hover:bg-[var(--muted)]"
                        >
                          Export as Excel
                        </button>
                        <button
                          onClick={() => exportReport(report.id, 'pdf')}
                          className="block w-full px-3 py-2 text-left text-sm text-[var(--foreground)] hover:bg-[var(--muted)] rounded-b-lg"
                        >
                          Export as PDF
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white border border-[var(--border)] rounded-lg p-4 sm:p-6">
          <h4 className="text-sm font-medium text-[var(--foreground)] mb-2">Quick Export</h4>
          <p className="text-xs text-[var(--muted-foreground)] mb-4">Export current view data</p>
          <button
            onClick={() => {
              // Export current filters as JSON
              const data = {
                filters,
                timestamp: new Date().toISOString()
              };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.json`;
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
              document.body.removeChild(a);
            }}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
          >
            Export Current View
          </button>
        </div>
        
        <div className="bg-white border border-[var(--border)] rounded-lg p-4 sm:p-6">
          <h4 className="text-sm font-medium text-[var(--foreground)] mb-2">Schedule Reports</h4>
          <p className="text-xs text-[var(--muted-foreground)] mb-4">Set up automated reports</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
          >
            Schedule New Report
          </button>
        </div>
        
        <div className="bg-white border border-[var(--border)] rounded-lg p-4 sm:p-6">
          <h4 className="text-sm font-medium text-[var(--foreground)] mb-2">Report Templates</h4>
          <p className="text-xs text-[var(--muted-foreground)] mb-4">Use pre-built templates</p>
          <button
            onClick={() => {
              // Load template
              setNewReport({
                name: "Monthly Profitability Report",
                description: "Standard monthly profitability analysis",
                reportType: "profitability",
                metrics: ["revenue", "costs", "profit", "margin"],
                filters: {},
                grouping: { period: "monthly" },
                dateRange: { preset: "last_month" }
              });
              setShowCreateForm(true);
            }}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
          >
            Load Template
          </button>
        </div>
      </div>
    </div>
  );
}
