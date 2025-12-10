export interface InvoiceEmailData {
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
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 40px; border-radius: 8px;">
    <h1 style="color: #059669; margin-bottom: 20px;">Invoice ${data.invoiceNumber}</h1>
    
    <p>Dear ${data.customerName},</p>
    
    <p>Please find attached your invoice from ${data.companyName}.</p>
    
    <div style="background: #f9fafb; padding: 20px; border-radius: 4px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
      <p style="margin: 5px 0;"><strong>Issue Date:</strong> ${formatDate(data.issueDate)}</p>
      <p style="margin: 5px 0;"><strong>Due Date:</strong> ${formatDate(data.dueDate)}</p>
      <p style="margin: 5px 0;"><strong>Total Amount:</strong> ${formatCurrency(data.total)}</p>
    </div>
    
    <p style="margin-top: 30px;">
      <a href="${data.invoiceUrl}" style="display: inline-block; background: #059669; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: 600;">
        View Invoice
      </a>
    </p>
    
    <p style="margin-top: 30px; color: #666; font-size: 14px;">
      If you have any questions about this invoice, please don't hesitate to contact us.
    </p>
    
    <p style="margin-top: 20px; color: #666; font-size: 14px;">
      Best regards,<br>
      ${data.companyName}
    </p>
  </div>
</body>
</html>
  `.trim();
}

export function generateInvoiceEmailText(data: InvoiceEmailData): string {
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
Invoice ${data.invoiceNumber}

Dear ${data.customerName},

Please find attached your invoice from ${data.companyName}.

Invoice Number: ${data.invoiceNumber}
Issue Date: ${formatDate(data.issueDate)}
Due Date: ${formatDate(data.dueDate)}
Total Amount: ${formatCurrency(data.total)}

View Invoice: ${data.invoiceUrl}

If you have any questions about this invoice, please don't hesitate to contact us.

Best regards,
${data.companyName}
  `.trim();
}
