export interface DeliveryNoteEmailData {
  deliveryNoteNumber: string;
  customerName: string;
  deliveryDate: Date;
  orderNumber: string;
  deliveryNoteUrl: string;
  companyName: string;
}

export function generateDeliveryNoteEmailHTML(data: DeliveryNoteEmailData): string {
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
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 40px; border-radius: 8px;">
    <h1 style="color: #059669; margin-bottom: 20px;">Delivery Note ${data.deliveryNoteNumber}</h1>
    
    <p>Dear ${data.customerName},</p>
    
    <p>Your order has been delivered. Please find attached your delivery note.</p>
    
    <div style="background: #f9fafb; padding: 20px; border-radius: 4px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Delivery Note Number:</strong> ${data.deliveryNoteNumber}</p>
      <p style="margin: 5px 0;"><strong>Order Number:</strong> ${data.orderNumber}</p>
      <p style="margin: 5px 0;"><strong>Delivery Date:</strong> ${formatDate(data.deliveryDate)}</p>
    </div>
    
    <p style="margin-top: 30px;">
      <a href="${data.deliveryNoteUrl}" style="display: inline-block; background: #059669; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: 600;">
        View Delivery Note
      </a>
    </p>
    
    <p style="margin-top: 30px; color: #666; font-size: 14px;">
      If you have any questions about this delivery, please don't hesitate to contact us.
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

export function generateDeliveryNoteEmailText(data: DeliveryNoteEmailData): string {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return `
Delivery Note ${data.deliveryNoteNumber}

Dear ${data.customerName},

Your order has been delivered. Please find attached your delivery note.

Delivery Note Number: ${data.deliveryNoteNumber}
Order Number: ${data.orderNumber}
Delivery Date: ${formatDate(data.deliveryDate)}

View Delivery Note: ${data.deliveryNoteUrl}

If you have any questions about this delivery, please don't hesitate to contact us.

Best regards,
${data.companyName}
  `.trim();
}
