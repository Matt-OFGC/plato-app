// Schedule export hook
import { useState } from 'react';

export function useScheduleExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const exportSchedule = async (scheduleData: any) => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      // Simulate export progress
      for (let i = 0; i <= 100; i += 10) {
        setExportProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Create and download CSV
      const csv = convertToCSV(scheduleData);
      downloadCSV(csv, 'schedule.csv');
      
      return { success: true };
    } catch (error) {
      console.error('Export failed:', error);
      return { success: false, error };
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  return {
    isExporting,
    exportProgress,
    exportSchedule
  };
}

function convertToCSV(data: any[]): string {
  if (!data.length) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}
