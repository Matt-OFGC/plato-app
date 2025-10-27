import Papa from "papaparse";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type ExportFormat = "csv" | "excel" | "pdf";

export interface ExportData {
  headers: string[];
  rows: (string | number)[][];
  title?: string;
  metadata?: Record<string, any>;
}

/**
 * Export data to CSV format
 */
export function exportToCSV(data: ExportData, filename?: string): void {
  const csv = Papa.unparse({
    fields: data.headers,
    data: data.rows,
  });
  
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", filename || `${data.title || "export"}-${new Date().toISOString().split("T")[0]}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export data to Excel format
 */
export function exportToExcel(data: ExportData, filename?: string): void {
  const workbook = XLSX.utils.book_new();
  
  // Create worksheet
  const worksheetData = [data.headers, ...data.rows];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // Set column widths
  const maxWidths = data.headers.map((_, colIndex) => {
    const maxLength = Math.max(
      data.headers[colIndex].length,
      ...data.rows.map(row => String(row[colIndex]).length)
    );
    return { wch: Math.min(maxLength + 2, 50) };
  });
  worksheet["!cols"] = maxWidths;
  
  // Add metadata sheet if provided
  if (data.metadata) {
    const metadataSheet = XLSX.utils.json_to_sheet([data.metadata]);
    XLSX.utils.book_append_sheet(workbook, metadataSheet, "Metadata");
  }
  
  // Add main data sheet
  XLSX.utils.book_append_sheet(workbook, worksheet, data.title || "Data");
  
  // Generate file
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", filename || `${data.title || "export"}-${new Date().toISOString().split("T")[0]}.xlsx`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export data to PDF format
 */
export function exportToPDF(
  data: ExportData,
  filename?: string,
  options?: {
    logoUrl?: string;
    companyName?: string;
    showMetadata?: boolean;
  }
): void {
  const doc = new jsPDF();
  
  // Add logo and header
  let yPos = 20;
  
  if (options?.logoUrl) {
    // Note: In a real implementation, you would need to load and add the image
    // For now, we'll just add text
    doc.setFontSize(20);
    doc.text(options.companyName || data.title || "Report", 14, yPos);
  } else if (options?.companyName || data.title) {
    doc.setFontSize(20);
    doc.text(options.companyName || data.title || "Report", 14, yPos);
  }
  
  yPos += 10;
  
  // Add date
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, yPos);
  
  yPos += 15;
  
  // Add metadata if provided and enabled
  if (options?.showMetadata && data.metadata) {
    doc.setFontSize(12);
    doc.text("Report Information", 14, yPos);
    yPos += 5;
    
    doc.setFontSize(10);
    Object.entries(data.metadata).forEach(([key, value]) => {
      doc.text(`${key}: ${value}`, 14, yPos);
      yPos += 5;
    });
    
    yPos += 5;
  }
  
  // Add table
  autoTable(doc, {
    startY: yPos,
    head: [data.headers.map(h => ({ content: h, styles: { fontStyle: "bold" } }))],
    body: data.rows,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [79, 70, 229] }, // indigo-600
    alternateRowStyles: { fillColor: [249, 250, 251] },
  });
  
  // Add page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() - 50, doc.internal.pageSize.getHeight() - 10);
  }
  
  // Save file
  doc.save(filename || `${data.title || "export"}-${new Date().toISOString().split("T")[0]}.pdf`);
}

/**
 * Export data in the specified format
 */
export function exportData(
  data: ExportData,
  format: ExportFormat,
  filename?: string,
  options?: {
    logoUrl?: string;
    companyName?: string;
    showMetadata?: boolean;
  }
): void {
  switch (format) {
    case "csv":
      exportToCSV(data, filename);
      break;
    case "excel":
      exportToExcel(data, filename);
      break;
    case "pdf":
      exportToPDF(data, filename, options);
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Convert array of objects to export data format
 */
export function convertToExportData<T extends Record<string, any>>(
  data: T[],
  columnMapping?: Record<keyof T, string>
): ExportData {
  if (data.length === 0) {
    return { headers: [], rows: [] };
  }
  
  // Use column mapping if provided, otherwise use object keys
  const headers = columnMapping
    ? Object.values(columnMapping)
    : Object.keys(data[0]) as string[];
  
  const rows = data.map(item =>
    (columnMapping ? Object.keys(columnMapping) : Object.keys(item)).map(key => {
      const value = item[key];
      return value !== null && value !== undefined ? String(value) : "";
    })
  );
  
  return { headers, rows };
}

/**
 * Export multiple datasets to a single Excel workbook
 */
export function exportToExcelMultiSheet(datasets: Array<{ name: string; data: ExportData }>, filename?: string): void {
  const workbook = XLSX.utils.book_new();
  
  for (const dataset of datasets) {
    const worksheetData = [dataset.data.headers, ...dataset.data.rows];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Set column widths
    const maxWidths = dataset.data.headers.map((_, colIndex) => {
      const maxLength = Math.max(
        dataset.data.headers[colIndex].length,
        ...dataset.data.rows.map(row => String(row[colIndex]).length)
      );
      return { wch: Math.min(maxLength + 2, 50) };
    });
    worksheet["!cols"] = maxWidths;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, dataset.name.substring(0, 31)); // Excel sheet name limit
  }
  
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", filename || `export-${new Date().toISOString().split("T")[0]}.xlsx`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
