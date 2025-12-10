/**
 * Invoice Email Template
 */

interface InvoiceEmailData {
  invoiceNumber: string;
  customerName: string;
  issueDate: Date;
  dueDate: Date;
  total: number;
  invoiceUrl: string;
  companyName: string;
}

export function generateInvoiceEmailHTML(data: InvoiceEmailData): string {
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
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: #059669;
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border-radius: 0 0 8px 8px;
    }
    .invoice-details {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background: #059669;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 12px;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Invoice ${escapeHtml(data.invoiceNumber)}</h1>
  </div>
  <div class="content">
    <p>Dear ${escapeHtml(data.customerName)},</p>
    
    <p>Please find attached your invoice for the goods/services provided.</p>
    
    <div class="invoice-details">
      <p><strong>Invoice Number:</strong> ${escapeHtml(data.invoiceNumber)}</p>
      <p><strong>Issue Date:</strong> ${formatDate(data.issueDate)}</p>
      <p><strong>Due Date:</strong> ${formatDate(data.dueDate)}</p>
      <p><strong>Total Amount:</strong> ${formatCurrency(data.total)}</p>
    </div>
    
    <p>
      <a href="${escapeHtml(data.invoiceUrl)}" class="button">View Invoice</a>
    </p>
    
    <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
    
    <p>Thank you for your business!</p>
    
    <div class="footer">
      <p>${escapeHtml(data.companyName)}</p>
    </div>
  </div>
</body>
</html>
  `;
}

export function generateInvoiceEmailText(data: InvoiceEmailData): string {
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
Invoice ${data.invoiceNumber}

Dear ${data.customerName},

Please find attached your invoice for the goods/services provided.

Invoice Number: ${data.invoiceNumber}
Issue Date: ${formatDate(data.issueDate)}
Due Date: ${formatDate(data.dueDate)}
Total Amount: ${formatCurrency(data.total)}

View Invoice: ${data.invoiceUrl}

If you have any questions about this invoice, please don't hesitate to contact us.

Thank you for your business!

${data.companyName}
  `.trim();
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

