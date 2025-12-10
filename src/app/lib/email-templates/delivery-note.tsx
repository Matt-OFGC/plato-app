/**
 * Delivery Note Email Template
 */

interface DeliveryNoteEmailData {
  deliveryNoteNumber: string;
  customerName: string;
  deliveryDate: Date;
  orderNumber?: string | null;
  deliveryNoteUrl: string;
  companyName: string;
}

export function generateDeliveryNoteEmailHTML(data: DeliveryNoteEmailData): string {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
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
    .delivery-details {
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
    <h1>Delivery Note ${escapeHtml(data.deliveryNoteNumber)}</h1>
  </div>
  <div class="content">
    <p>Dear ${escapeHtml(data.customerName)},</p>
    
    <p>Your order has been delivered. Please find attached the delivery note.</p>
    
    <div class="delivery-details">
      <p><strong>Delivery Note Number:</strong> ${escapeHtml(data.deliveryNoteNumber)}</p>
      ${data.orderNumber ? `<p><strong>Order Number:</strong> ${escapeHtml(data.orderNumber)}</p>` : ''}
      <p><strong>Delivery Date:</strong> ${formatDate(data.deliveryDate)}</p>
    </div>
    
    <p>
      <a href="${escapeHtml(data.deliveryNoteUrl)}" class="button">View Delivery Note</a>
    </p>
    
    <p>Please check all items and contact us if there are any discrepancies.</p>
    
    <p>Thank you for your business!</p>
    
    <div class="footer">
      <p>${escapeHtml(data.companyName)}</p>
    </div>
  </div>
</body>
</html>
  `;
}

export function generateDeliveryNoteEmailText(data: DeliveryNoteEmailData): string {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return `
Delivery Note ${data.deliveryNoteNumber}

Dear ${data.customerName},

Your order has been delivered. Please find attached the delivery note.

Delivery Note Number: ${data.deliveryNoteNumber}
${data.orderNumber ? `Order Number: ${data.orderNumber}\n` : ''}Delivery Date: ${formatDate(data.deliveryDate)}

View Delivery Note: ${data.deliveryNoteUrl}

Please check all items and contact us if there are any discrepancies.

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

