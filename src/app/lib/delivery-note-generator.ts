/**
 * Delivery Note PDF Generation Utility
 */

interface DeliveryNoteData {
  deliveryNoteNumber: string;
  deliveryDate: Date;
  orderNumber?: string | null;
  customer: {
    name: string;
    address?: string | null;
    city?: string | null;
    postcode?: string | null;
    country?: string | null;
  };
  company: {
    name: string;
    address?: string | null;
    city?: string | null;
    postcode?: string | null;
    country?: string | null;
  };
  items: Array<{
    name: string;
    quantity: number;
    unit?: string | null;
    description?: string | null;
  }>;
  deliveredBy?: string | null;
  notes?: string | null;
}

export function generateDeliveryNoteHTML(data: DeliveryNoteData): string {
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
    .delivery-note-info {
      text-align: right;
    }
    .delivery-note-info h2 {
      font-size: 20px;
      color: #333;
      margin-bottom: 10px;
    }
    .delivery-note-number {
      font-size: 14px;
      font-weight: bold;
      color: #666;
    }
    .delivery-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
    }
    .deliver-to, .deliver-from {
      flex: 1;
    }
    .deliver-to {
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
    .text-right {
      text-align: right;
    }
    .signature-section {
      margin-top: 60px;
      display: flex;
      justify-content: space-between;
    }
    .signature-box {
      width: 45%;
      border-top: 2px solid #333;
      padding-top: 10px;
      margin-top: 60px;
    }
    .signature-box label {
      font-size: 11px;
      color: #666;
      display: block;
      margin-bottom: 4px;
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
    </div>
    <div class="delivery-note-info">
      <h2>DELIVERY NOTE</h2>
      <div class="delivery-note-number">${escapeHtml(data.deliveryNoteNumber)}</div>
      <div style="margin-top: 20px; font-size: 11px;">
        <div><strong>Delivery Date:</strong> ${formatDate(data.deliveryDate)}</div>
        ${data.orderNumber ? `<div><strong>Order Number:</strong> ${escapeHtml(data.orderNumber)}</div>` : ''}
        ${data.deliveredBy ? `<div><strong>Delivered By:</strong> ${escapeHtml(data.deliveredBy)}</div>` : ''}
      </div>
    </div>
  </div>

  <div class="delivery-info">
    <div class="deliver-to">
      <div class="section-title">Deliver To</div>
      <div class="section-content">
        <strong>${escapeHtml(data.customer.name)}</strong>
        ${data.customer.address ? `<div>${escapeHtml(data.customer.address)}</div>` : ''}
        ${data.customer.city || data.customer.postcode ? `<div>${escapeHtml([data.customer.city, data.customer.postcode].filter(Boolean).join(', '))}</div>` : ''}
        ${data.customer.country ? `<div>${escapeHtml(data.customer.country)}</div>` : ''}
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="text-right">Quantity</th>
      </tr>
    </thead>
    <tbody>
      ${data.items.map(item => `
        <tr>
          <td>
            <strong>${escapeHtml(item.name)}</strong>
            ${item.description ? `<div style="font-size: 10px; color: #666; margin-top: 4px;">${escapeHtml(item.description)}</div>` : ''}
          </td>
          <td class="text-right">${item.quantity} ${item.unit || ''}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  ${data.notes ? `
    <div class="notes">
      <h3>Notes</h3>
      <div>${escapeHtml(data.notes)}</div>
    </div>
  ` : ''}

  <div class="signature-section">
    <div class="signature-box">
      <label>Received By:</label>
      <div style="height: 40px;"></div>
    </div>
    <div class="signature-box">
      <label>Signature:</label>
      <div style="height: 40px;"></div>
    </div>
  </div>

  <div class="footer">
    <div>Please check all items before signing</div>
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

