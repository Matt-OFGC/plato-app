/**
 * Invoice PDF Generation Utility
 * Generates PDF invoices from invoice data
 */

interface InvoiceData {
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  customer: {
    name: string;
    address?: string | null;
    city?: string | null;
    postcode?: string | null;
    country?: string | null;
    email?: string | null;
    phone?: string | null;
    taxId?: string | null;
  };
  company: {
    name: string;
    address?: string | null;
    city?: string | null;
    postcode?: string | null;
    country?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
    description?: string | null;
  }>;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes?: string | null;
  paymentTerms?: string | null;
}

/**
 * Generate HTML for invoice PDF
 */
export function generateInvoiceHTML(data: InvoiceData): string {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 12px;
      line-height: 1.6;
      color: #333;
      padding: 40px;
      background: white;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 20px;
    }
    .company-info h1 {
      font-size: 24px;
      color: #059669;
      margin-bottom: 10px;
    }
    .invoice-info {
      text-align: right;
    }
    .invoice-info h2 {
      font-size: 20px;
      color: #333;
      margin-bottom: 10px;
    }
    .invoice-number {
      font-size: 14px;
      font-weight: bold;
      color: #666;
    }
    .billing-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
    }
    .bill-to, .bill-from {
      flex: 1;
    }
    .bill-to {
      margin-right: 40px;
    }
    .section-title {
      font-size: 10px;
      text-transform: uppercase;
      color: #666;
      margin-bottom: 8px;
      font-weight: 600;
    }
    .section-content {
      font-size: 12px;
      line-height: 1.8;
    }
    .section-content strong {
      display: block;
      font-size: 14px;
      margin-bottom: 4px;
      color: #111;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    thead {
      background: #f9fafb;
      border-bottom: 2px solid #e5e7eb;
    }
    th {
      text-align: left;
      padding: 12px;
      font-size: 11px;
      text-transform: uppercase;
      color: #666;
      font-weight: 600;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #f3f4f6;
    }
    tbody tr:hover {
      background: #f9fafb;
    }
    .text-right {
      text-align: right;
    }
    .totals {
      margin-left: auto;
      width: 300px;
      margin-top: 20px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .total-row:last-child {
      border-bottom: 2px solid #333;
      font-weight: bold;
      font-size: 16px;
      padding-top: 12px;
      margin-top: 8px;
    }
    .notes {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    .notes h3 {
      font-size: 12px;
      margin-bottom: 8px;
      color: #666;
    }
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #666;
      font-size: 10px;
    }
    @media print {
      body {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      <h1>${escapeHtml(data.company.name)}</h1>
      ${data.company.address ? `<div>${escapeHtml(data.company.address)}</div>` : ''}
      ${data.company.city || data.company.postcode ? `<div>${escapeHtml([data.company.city, data.company.postcode].filter(Boolean).join(', '))}</div>` : ''}
      ${data.company.country ? `<div>${escapeHtml(data.company.country)}</div>` : ''}
      ${data.company.email ? `<div>${escapeHtml(data.company.email)}</div>` : ''}
      ${data.company.phone ? `<div>${escapeHtml(data.company.phone)}</div>` : ''}
    </div>
    <div class="invoice-info">
      <h2>INVOICE</h2>
      <div class="invoice-number">${escapeHtml(data.invoiceNumber)}</div>
      <div style="margin-top: 20px; font-size: 11px;">
        <div><strong>Issue Date:</strong> ${formatDate(data.issueDate)}</div>
        <div><strong>Due Date:</strong> ${formatDate(data.dueDate)}</div>
      </div>
    </div>
  </div>

  <div class="billing-info">
    <div class="bill-to">
      <div class="section-title">Bill To</div>
      <div class="section-content">
        <strong>${escapeHtml(data.customer.name)}</strong>
        ${data.customer.address ? `<div>${escapeHtml(data.customer.address)}</div>` : ''}
        ${data.customer.city || data.customer.postcode ? `<div>${escapeHtml([data.customer.city, data.customer.postcode].filter(Boolean).join(', '))}</div>` : ''}
        ${data.customer.country ? `<div>${escapeHtml(data.customer.country)}</div>` : ''}
        ${data.customer.email ? `<div>${escapeHtml(data.customer.email)}</div>` : ''}
        ${data.customer.phone ? `<div>${escapeHtml(data.customer.phone)}</div>` : ''}
        ${data.customer.taxId ? `<div style="margin-top: 8px;"><strong>Tax ID:</strong> ${escapeHtml(data.customer.taxId)}</div>` : ''}
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="text-right">Quantity</th>
        <th class="text-right">Unit Price</th>
        <th class="text-right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${data.items.map(item => `
        <tr>
          <td>
            <strong>${escapeHtml(item.name)}</strong>
            ${item.description ? `<div style="font-size: 10px; color: #666; margin-top: 4px;">${escapeHtml(item.description)}</div>` : ''}
          </td>
          <td class="text-right">${item.quantity}</td>
          <td class="text-right">${formatCurrency(item.unitPrice)}</td>
          <td class="text-right"><strong>${formatCurrency(item.total)}</strong></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="total-row">
      <span>Subtotal:</span>
      <span>${formatCurrency(data.subtotal)}</span>
    </div>
    ${data.taxRate > 0 ? `
      <div class="total-row">
        <span>Tax (${data.taxRate}%):</span>
        <span>${formatCurrency(data.taxAmount)}</span>
      </div>
    ` : ''}
    <div class="total-row">
      <span>Total:</span>
      <span>${formatCurrency(data.total)}</span>
    </div>
  </div>

  ${data.paymentTerms ? `
    <div class="notes">
      <h3>Payment Terms</h3>
      <div>${escapeHtml(data.paymentTerms)}</div>
    </div>
  ` : ''}

  ${data.notes ? `
    <div class="notes">
      <h3>Notes</h3>
      <div>${escapeHtml(data.notes)}</div>
    </div>
  ` : ''}

  <div class="footer">
    <div>Thank you for your business!</div>
  </div>
</body>
</html>
  `;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Generate PDF from invoice data (server-side)
 * This is a placeholder - in production, use a library like puppeteer or pdfkit
 */
export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  // For now, return HTML that can be printed or converted to PDF
  // In production, use puppeteer or similar to generate actual PDF
  const html = generateInvoiceHTML(data);
  
  // TODO: Implement actual PDF generation using puppeteer or similar
  // For now, this returns the HTML which can be used with window.print() on client
  throw new Error("PDF generation not yet implemented. Use generateInvoiceHTML and render in browser for printing.");
}

