"use client";

import React, { useState, useEffect } from 'react';
import { Download, Printer, Calendar, Clock } from 'lucide-react';

interface GeneratedDocument {
  id: number;
  documentType: string;
  products: Array<{
    recipe_name: string;
    quantity: number;
  }>;
  totalItems: number;
  sheetsPrinted?: number;
  generatedAt: string;
  generated_by_name: string;
  pdfFilePath?: string;
}

interface HistoryViewProps {
  documentType?: string;
}

export function HistoryView({ documentType = 'label' }: HistoryViewProps) {
  const [history, setHistory] = useState<GeneratedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDays, setFilterDays] = useState(7);

  useEffect(() => {
    loadHistory();
  }, [filterDays, documentType]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/generated-documents?type=${documentType}&days=${filterDays}`);
      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error('Failed to load history:', error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async (documentId: number) => {
    try {
      const response = await fetch(`/api/generated-documents/${documentId}/download`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `labels-${documentId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download:', error);
      alert('Failed to download PDF');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  };

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-2">
          Print History
        </h1>
        <p className="text-lg text-gray-500">
          View and reprint past labels
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white/70 backdrop-blur-2xl rounded-2xl border border-gray-200/60 shadow-lg p-4 flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Show:</label>
        <select
          value={filterDays}
          onChange={(e) => setFilterDays(parseInt(e.target.value))}
          className="px-4 py-2 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="7">Last 7 days</option>
          <option value="14">Last 14 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>

        <div className="ml-auto text-sm text-gray-600">
          {history.length} {history.length === 1 ? 'record' : 'records'} found
        </div>
      </div>

      {/* History List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading history...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl border-2 border-dashed border-gray-300 p-12 text-center">
          <Calendar size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No History Found
          </h3>
          <p className="text-gray-600">
            Labels you generate will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map(doc => (
            <div
              key={doc.id}
              className="bg-white/70 backdrop-blur-xl rounded-2xl border border-gray-200/60 shadow-lg p-6 hover:shadow-xl transition-all"
            >
              <div className="flex items-start justify-between">

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {doc.products.length} {doc.products.length === 1 ? 'Product' : 'Products'} • {doc.totalItems} Labels
                    </h3>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      {doc.documentType}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>{getTimeAgo(doc.generatedAt)}</span>
                    </div>
                    <span>•</span>
                    <span>{formatDate(doc.generatedAt)}</span>
                    {doc.sheetsPrinted && (
                      <>
                        <span>•</span>
                        <span>{doc.sheetsPrinted} sheets</span>
                      </>
                    )}
                    <span>•</span>
                    <span>By {doc.generated_by_name}</span>
                  </div>

                  {/* Products List */}
                  <div className="flex flex-wrap gap-2">
                    {doc.products.slice(0, 5).map((product, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        {product.recipe_name} ({product.quantity})
                      </span>
                    ))}
                    {doc.products.length > 5 && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        +{doc.products.length - 5} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => downloadPDF(doc.id)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all flex items-center gap-2"
                    title="Download PDF"
                  >
                    <Download size={16} />
                    Download
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all"
                    title="Print again"
                  >
                    <Printer size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
