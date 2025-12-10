export interface DeliveryNoteData {
  deliveryNoteNumber: string;
  deliveryDate: Date;
  orderNumber: string;
  customer: {
    name: string;
    address: string | null;
    city: string | null;
    postcode: string | null;
    country: string | null;
  };
  company: {
    name: string;
    address: string | null;
    city: string | null;
    postcode: string | null;
    country: string | null;
  };
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    description?: string;
  }>;
  deliveredBy?: string | null;
  notes?: string | null;
}

export function generateDeliveryNoteHTML(data: DeliveryNoteData): string {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Delivery Note ${data.deliveryNoteNumber}</title>
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
    .delivery-note-info {
      text-align: right;
    }
    .delivery-note-info h2 {
      font-size: 28px;
      color: #333;
      margin-bottom: 10px;
    }
    .delivery-note-number {
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
      </div>
      <div class="delivery-note-info">
        <h2>DELIVERY NOTE</h2>
        <div class="delivery-note-number">#${data.deliveryNoteNumber}</div>
      </div>
    </div>

    <div class="details">
      <div class="section">
        <h3>Deliver To</h3>
        <p><strong>${data.customer.name}</strong></p>
        ${data.customer.address ? `<p>${data.customer.address}</p>` : ''}
        ${data.customer.city || data.customer.postcode ? `<p>${data.customer.city || ''}${data.customer.city && data.customer.postcode ? ', ' : ''}${data.customer.postcode || ''}</p>` : ''}
        ${data.customer.country ? `<p>${data.customer.country}</p>` : ''}
      </div>
      <div class="section">
        <h3>Delivery Details</h3>
        <p><strong>Delivery Date:</strong> ${formatDate(data.deliveryDate)}</p>
        <p><strong>Order Number:</strong> ${data.orderNumber}</p>
        ${data.deliveredBy ? `<p><strong>Delivered By:</strong> ${data.deliveredBy}</p>` : ''}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th class="text-right">Quantity</th>
          <th>Unit</th>
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
            <td>${item.unit}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

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
