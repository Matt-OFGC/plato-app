export interface InvoiceData {
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  customer: {
    name: string;
    address: string | null;
    city: string | null;
    postcode: string | null;
    country: string | null;
    email: string | null;
    phone: string | null;
    taxId: string | null;
  };
  company: {
    name: string;
    address: string | null;
    city: string | null;
    postcode: string | null;
    country: string | null;
    email: string | null;
    phone: string | null;
  };
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
    description?: string;
  }>;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes?: string | null;
  paymentTerms?: string | null;
}

export function generateInvoiceHTML(data: InvoiceData): string {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${data.invoiceNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #fff;
      padding: 40px 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: #fff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #059669;
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
      font-size: 28px;
      color: #333;
      margin-bottom: 10px;
    }
    .invoice-number {
      font-size: 18px;
      color: #666;
    }
    .details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-bottom: 40px;
    }
    .section h3 {
      font-size: 14px;
      text-transform: uppercase;
      color: #666;
      margin-bottom: 10px;
      letter-spacing: 0.5px;
    }
    .section p {
      margin: 5px 0;
      color: #333;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    thead {
      background: #f9fafb;
    }
    th {
      text-align: left;
      padding: 12px;
      font-weight: 600;
      color: #333;
      border-bottom: 2px solid #e5e7eb;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
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
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
    }
    .totals-row.total {
      font-size: 20px;
      font-weight: 700;
      padding-top: 15px;
      border-top: 2px solid #059669;
      color: #059669;
    }
    .notes {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    .notes h3 {
      font-size: 14px;
      text-transform: uppercase;
      color: #666;
      margin-bottom: 10px;
    }
    @media print {
      body {
        padding: 0;
      }
      .container {
        max-width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="company-info">
        <h1>${data.company.name}</h1>
        ${data.company.address ? `<p>${data.company.address}</p>` : ''}
        ${data.company.city || data.company.postcode ? `<p>${data.company.city || ''}${data.company.city && data.company.postcode ? ', ' : ''}${data.company.postcode || ''}</p>` : ''}
        ${data.company.country ? `<p>${data.company.country}</p>` : ''}
        ${data.company.email ? `<p>Email: ${data.company.email}</p>` : ''}
        ${data.company.phone ? `<p>Phone: ${data.company.phone}</p>` : ''}
      </div>
      <div class="invoice-info">
        <h2>INVOICE</h2>
        <div class="invoice-number">#${data.invoiceNumber}</div>
      </div>
    </div>

    <div class="details">
      <div class="section">
        <h3>Bill To</h3>
        <p><strong>${data.customer.name}</strong></p>
        ${data.customer.address ? `<p>${data.customer.address}</p>` : ''}
        ${data.customer.city || data.customer.postcode ? `<p>${data.customer.city || ''}${data.customer.city && data.customer.postcode ? ', ' : ''}${data.customer.postcode || ''}</p>` : ''}
        ${data.customer.country ? `<p>${data.customer.country}</p>` : ''}
        ${data.customer.email ? `<p>Email: ${data.customer.email}</p>` : ''}
        ${data.customer.phone ? `<p>Phone: ${data.customer.phone}</p>` : ''}
        ${data.customer.taxId ? `<p>Tax ID: ${data.customer.taxId}</p>` : ''}
      </div>
      <div class="section">
        <h3>Invoice Details</h3>
        <p><strong>Issue Date:</strong> ${formatDate(data.issueDate)}</p>
        <p><strong>Due Date:</strong> ${formatDate(data.dueDate)}</p>
        ${data.paymentTerms ? `<p><strong>Payment Terms:</strong> ${data.paymentTerms}</p>` : ''}
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
              <strong>${item.name}</strong>
              ${item.description ? `<br><small style="color: #666;">${item.description}</small>` : ''}
            </td>
            <td class="text-right">${item.quantity}</td>
            <td class="text-right">${formatCurrency(item.unitPrice)}</td>
            <td class="text-right">${formatCurrency(item.total)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row">
        <span>Subtotal:</span>
        <span>${formatCurrency(data.subtotal)}</span>
      </div>
      ${data.taxRate > 0 ? `
        <div class="totals-row">
          <span>Tax (${data.taxRate}%):</span>
          <span>${formatCurrency(data.taxAmount)}</span>
        </div>
      ` : ''}
      <div class="totals-row total">
        <span>Total:</span>
        <span>${formatCurrency(data.total)}</span>
      </div>
    </div>

    ${data.notes ? `
      <div class="notes">
        <h3>Notes</h3>
        <p>${data.notes}</p>
      </div>
    ` : ''}
  </div>
</body>
</html>
  `.trim();
}
