// CSV Export functionality for staff schedules
// Generates downloadable CSV files with staff hours and totals

import { format, startOfWeek, endOfWeek, addDays } from 'date-fns';

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

interface ExportOptions {
  includeBreaks: boolean;
  includeTotals: boolean;
  dateFormat: 'short' | 'long';
  timeFormat: '12h' | '24h';
}

export class ScheduleExporter {
  private shifts: Shift[];
  private options: ExportOptions;

  constructor(shifts: Shift[], options: Partial<ExportOptions> = {}) {
    this.shifts = shifts;
    this.options = {
      includeBreaks: true,
      includeTotals: true,
      dateFormat: 'short',
      timeFormat: '24h',
      ...options,
    };
  }

  // Export current week
  exportWeek(weekStart: Date): string {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const weekShifts = this.getShiftsForWeek(weekStart, weekEnd);
    
    return this.generateCSV(weekShifts, `Week of ${format(weekStart, 'MMM dd, yyyy')}`);
  }

  // Export current month
  exportMonth(monthStart: Date): string {
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
    const monthShifts = this.getShiftsForDateRange(monthStart, monthEnd);
    
    return this.generateCSV(monthShifts, `Month of ${format(monthStart, 'MMMM yyyy')}`);
  }

  // Export custom date range
  exportDateRange(startDate: Date, endDate: Date): string {
    const rangeShifts = this.getShiftsForDateRange(startDate, endDate);
    
    return this.generateCSV(rangeShifts, `${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd, yyyy')}`);
  }

  // Generate CSV content
  private generateCSV(shifts: Shift[], title: string): string {
    const csvRows: string[] = [];
    
    // Add title row
    csvRows.push(`"${title}"`);
    csvRows.push(''); // Empty row
    
    // Add headers
    const headers = [
      'Staff Name',
      'Date',
      'Day',
      'Start Time',
      'End Time',
      'Hours Worked',
    ];
    
    if (this.options.includeBreaks) {
      headers.push('Break Duration');
      headers.push('Net Hours');
    }
    
    csvRows.push(headers.map(header => `"${header}"`).join(','));
    
    // Group shifts by staff member
    const shiftsByStaff = this.groupShiftsByStaff(shifts);
    
    // Add data rows
    Object.entries(shiftsByStaff).forEach(([staffName, staffShifts]) => {
      staffShifts.forEach(shift => {
        const row = this.createShiftRow(shift);
        csvRows.push(row);
      });
    });
    
    // Add totals row if enabled
    if (this.options.includeTotals) {
      csvRows.push(''); // Empty row
      csvRows.push(this.createTotalsRow(shifts));
    }
    
    // Add summary
    csvRows.push(''); // Empty row
    csvRows.push(this.createSummaryRow(shifts));
    
    return csvRows.join('\n');
  }

  // Create a row for a single shift
  private createShiftRow(shift: Shift): string {
    const startTime = new Date(shift.startTime);
    const endTime = new Date(shift.endTime);
    
    const dateStr = this.formatDate(startTime);
    const dayStr = format(startTime, 'EEEE');
    const startStr = this.formatTime(startTime);
    const endStr = this.formatTime(endTime);
    
    const totalHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    const netHours = totalHours - shift.breakDuration;
    
    const row = [
      `"${shift.staff.name}"`,
      `"${dateStr}"`,
      `"${dayStr}"`,
      `"${startStr}"`,
      `"${endStr}"`,
      `"${totalHours.toFixed(2)}"`,
    ];
    
    if (this.options.includeBreaks) {
      row.push(`"${shift.breakDuration.toFixed(2)}"`);
      row.push(`"${netHours.toFixed(2)}"`);
    }
    
    return row.join(',');
  }

  // Create totals row
  private createTotalsRow(shifts: Shift[]): string {
    const shiftsByStaff = this.groupShiftsByStaff(shifts);
    const totalsRow = ['"TOTALS"', '""', '""', '""', '""', '""'];
    
    if (this.options.includeBreaks) {
      totalsRow.push('""', '""');
    }
    
    csvRows.push(totalsRow.join(','));
    
    // Add individual staff totals
    Object.entries(shiftsByStaff).forEach(([staffName, staffShifts]) => {
      const totalHours = staffShifts.reduce((sum, shift) => {
        const duration = (new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / (1000 * 60 * 60);
        return sum + duration;
      }, 0);
      
      const totalBreaks = staffShifts.reduce((sum, shift) => sum + shift.breakDuration, 0);
      const netHours = totalHours - totalBreaks;
      
      const staffTotalRow = [
        `"${staffName} Total"`,
        '""',
        '""',
        '""',
        '""',
        `"${totalHours.toFixed(2)}"`,
      ];
      
      if (this.options.includeBreaks) {
        staffTotalRow.push(`"${totalBreaks.toFixed(2)}"`);
        staffTotalRow.push(`"${netHours.toFixed(2)}"`);
      }
      
      csvRows.push(staffTotalRow.join(','));
    });
    
    return csvRows.join('\n');
  }

  // Create summary row
  private createSummaryRow(shifts: Shift[]): string {
    const totalShifts = shifts.length;
    const totalHours = shifts.reduce((sum, shift) => {
      const duration = (new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / (1000 * 60 * 60);
      return sum + duration;
    }, 0);
    
    const totalBreaks = shifts.reduce((sum, shift) => sum + shift.breakDuration, 0);
    const netHours = totalHours - totalBreaks;
    const uniqueStaff = new Set(shifts.map(shift => shift.staff.id)).size;
    
    const summaryRows = [
      `"SUMMARY"`,
      `"Total Shifts: ${totalShifts}"`,
      `"Total Staff: ${uniqueStaff}"`,
      `"Total Hours: ${totalHours.toFixed(2)}"`,
    ];
    
    if (this.options.includeBreaks) {
      summaryRows.push(`"Total Breaks: ${totalBreaks.toFixed(2)}"`);
      summaryRows.push(`"Net Hours: ${netHours.toFixed(2)}"`);
    }
    
    return summaryRows.join('\n');
  }

  // Helper methods
  private getShiftsForWeek(weekStart: Date, weekEnd: Date): Shift[] {
    return this.shifts.filter(shift => {
      const shiftDate = new Date(shift.startTime);
      return shiftDate >= weekStart && shiftDate <= weekEnd;
    });
  }

  private getShiftsForDateRange(startDate: Date, endDate: Date): Shift[] {
    return this.shifts.filter(shift => {
      const shiftDate = new Date(shift.startTime);
      return shiftDate >= startDate && shiftDate <= endDate;
    });
  }

  private groupShiftsByStaff(shifts: Shift[]): Record<string, Shift[]> {
    return shifts.reduce((groups, shift) => {
      const staffName = shift.staff.name;
      if (!groups[staffName]) {
        groups[staffName] = [];
      }
      groups[staffName].push(shift);
      return groups;
    }, {} as Record<string, Shift[]>);
  }

  private formatDate(date: Date): string {
    if (this.options.dateFormat === 'long') {
      return format(date, 'EEEE, MMMM dd, yyyy');
    } else {
      return format(date, 'MMM dd, yyyy');
    }
  }

  private formatTime(date: Date): string {
    if (this.options.timeFormat === '12h') {
      return format(date, 'h:mm a');
    } else {
      return format(date, 'HH:mm');
    }
  }
}

// Utility functions for downloading CSV
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function generateFilename(prefix: string, date: Date, type: 'week' | 'month' | 'range'): string {
  const dateStr = format(date, 'yyyy-MM-dd');
  return `${prefix}-${dateStr}.csv`;
}

// React hook for CSV export
export function useScheduleExport(shifts: Shift[]) {
  const exportWeek = (weekStart: Date, options?: Partial<ExportOptions>) => {
    const exporter = new ScheduleExporter(shifts, options);
    const csvContent = exporter.exportWeek(weekStart);
    const filename = generateFilename('schedule-week', weekStart, 'week');
    downloadCSV(csvContent, filename);
  };

  const exportMonth = (monthStart: Date, options?: Partial<ExportOptions>) => {
    const exporter = new ScheduleExporter(shifts, options);
    const csvContent = exporter.exportMonth(monthStart);
    const filename = generateFilename('schedule-month', monthStart, 'month');
    downloadCSV(csvContent, filename);
  };

  const exportDateRange = (startDate: Date, endDate: Date, options?: Partial<ExportOptions>) => {
    const exporter = new ScheduleExporter(shifts, options);
    const csvContent = exporter.exportDateRange(startDate, endDate);
    const filename = generateFilename('schedule-range', startDate, 'range');
    downloadCSV(csvContent, filename);
  };

  return {
    exportWeek,
    exportMonth,
    exportDateRange,
  };
}


