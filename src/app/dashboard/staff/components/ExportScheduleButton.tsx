"use client";

import { useState } from "react";
import { format, startOfWeek, startOfMonth, subMonths, addMonths } from "date-fns";
import { useScheduleExport } from "@/lib/schedule-export";

interface Shift {
  id: number;
  staffId: number;
  startTime: Date;
  endTime: Date;
  breakDuration: number;
  staff: {
    id: number;
    name: string;
    email: string;
  };
}

interface ExportScheduleButtonProps {
  shifts: Shift[];
  currentWeek?: Date;
  className?: string;
}

export function ExportScheduleButton({ 
  shifts, 
  currentWeek = new Date(),
  className = "" 
}: ExportScheduleButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'week' | 'month' | 'range'>('week');
  const [customStartDate, setCustomStartDate] = useState<Date>(new Date());
  const [customEndDate, setCustomEndDate] = useState<Date>(new Date());
  const [options, setOptions] = useState({
    includeBreaks: true,
    includeTotals: true,
    dateFormat: 'short' as 'short' | 'long',
    timeFormat: '24h' as '12h' | '24h',
  });

  const { exportWeek, exportMonth, exportDateRange } = useScheduleExport(shifts);

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      switch (exportType) {
        case 'week':
          exportWeek(currentWeek, options);
          break;
        case 'month':
          exportMonth(startOfMonth(currentWeek), options);
          break;
        case 'range':
          exportDateRange(customStartDate, customEndDate, options);
          break;
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  };

  const weekOptions = [
    { label: 'Current Week', value: currentWeek },
    { label: 'Last Week', value: new Date(currentWeek.getTime() - 7 * 24 * 60 * 60 * 1000) },
    { label: 'Next Week', value: new Date(currentWeek.getTime() + 7 * 24 * 60 * 60 * 1000) },
  ];

  const monthOptions = [
    { label: 'Current Month', value: startOfMonth(currentWeek) },
    { label: 'Last Month', value: startOfMonth(subMonths(currentWeek, 1)) },
    { label: 'Next Month', value: startOfMonth(addMonths(currentWeek, 1)) },
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors ${className}`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>Export</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Export Schedule</h2>
                  <p className="text-emerald-100 mt-1">
                    Download schedule data as CSV
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:text-emerald-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Export Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Export Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'week', label: 'Week', icon: '📅' },
                    { value: 'month', label: 'Month', icon: '📆' },
                    { value: 'range', label: 'Custom Range', icon: '📊' },
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setExportType(type.value as any)}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        exportType === type.value
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{type.icon}</div>
                      <div className="text-sm font-medium">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Selection */}
              {exportType === 'week' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Week
                  </label>
                  <select
                    value={currentWeek.toISOString()}
                    onChange={(e) => setCurrentWeek(new Date(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    {weekOptions.map((option) => (
                      <option key={option.value.toISOString()} value={option.value.toISOString()}>
                        {option.label} ({format(startOfWeek(option.value, { weekStartsOn: 1 }), 'MMM dd')})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {exportType === 'month' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Month
                  </label>
                  <select
                    value={startOfMonth(currentWeek).toISOString()}
                    onChange={(e) => setCurrentWeek(new Date(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    {monthOptions.map((option) => (
                      <option key={option.value.toISOString()} value={option.value.toISOString()}>
                        {option.label} ({format(option.value, 'MMMM yyyy')})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {exportType === 'range' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={customStartDate.toISOString().split('T')[0]}
                      onChange={(e) => setCustomStartDate(new Date(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={customEndDate.toISOString().split('T')[0]}
                      onChange={(e) => setCustomEndDate(new Date(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* Export Options */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Export Options</h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={options.includeBreaks}
                      onChange={(e) => setOptions(prev => ({ ...prev, includeBreaks: e.target.checked }))}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Include break durations</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={options.includeTotals}
                      onChange={(e) => setOptions(prev => ({ ...prev, includeTotals: e.target.checked }))}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Include totals and summary</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date Format
                    </label>
                    <select
                      value={options.dateFormat}
                      onChange={(e) => setOptions(prev => ({ ...prev, dateFormat: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="short">Short (Jan 15, 2025)</option>
                      <option value="long">Long (Monday, January 15, 2025)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time Format
                    </label>
                    <select
                      value={options.timeFormat}
                      onChange={(e) => setOptions(prev => ({ ...prev, timeFormat: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="24h">24 Hour (14:30)</option>
                      <option value="12h">12 Hour (2:30 PM)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Export Preview</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>• {shifts.length} shifts will be exported</div>
                  <div>• {new Set(shifts.map(s => s.staff.id)).size} unique staff members</div>
                  <div>• {options.includeBreaks ? 'Including' : 'Excluding'} break durations</div>
                  <div>• {options.includeTotals ? 'Including' : 'Excluding'} totals and summary</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? 'Exporting...' : 'Export CSV'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

