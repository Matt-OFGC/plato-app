// Email utility for sending order confirmations and notifications
// This can be configured to use SendGrid, Resend, AWS SES, or SMTP

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Check if email service is configured
    const emailProvider = process.env.EMAIL_PROVIDER; // 'resend', 'sendgrid', 'smtp', etc.
    
    if (!emailProvider) {
      console.log('📧 Email would be sent to:', options.to);
      console.log('Subject:', options.subject);
      console.log('(Email provider not configured - set EMAIL_PROVIDER in .env)');
      return true; // Return success in development
    }

    // Implement different providers
    switch (emailProvider) {
      case 'resend':
        return await sendViaResend(options);
      case 'sendgrid':
        return await sendViaSendGrid(options);
      case 'console':
        // For development - just log
        console.log('📧 Email:', options);
        return true;
      default:
        console.warn(`Unknown email provider: ${emailProvider}`);
        return false;
    }
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

async function sendViaResend(options: EmailOptions): Promise<boolean> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured');
    return false;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'orders@plato.app',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    }),
  });

  return response.ok;
}

async function sendViaSendGrid(options: EmailOptions): Promise<boolean> {
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  if (!SENDGRID_API_KEY) {
    console.error('SENDGRID_API_KEY not configured');
    return false;
  }

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SENDGRID_API_KEY}`,
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: options.to }] }],
      from: { email: process.env.EMAIL_FROM || 'orders@plato.app' },
      subject: options.subject,
      content: [
        { type: 'text/html', value: options.html },
        ...(options.text ? [{ type: 'text/plain', value: options.text }] : []),
      ],
    }),
  });

  return response.ok;
}

// Template for order confirmation email
export function generateOrderConfirmationEmail(order: {
  orderNumber?: string;
  customer: { name: string; email: string };
  company: { name: string };
  items: Array<{ recipe: { name: string }; quantity: number }>;
  deliveryDate?: Date;
  notes?: string;
}) {
  const itemsList = order.items
    .map(item => `<li>${item.quantity}x ${item.recipe.name}</li>`)
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px 20px; border-radius: 0 0 8px 8px; }
        .card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .items { list-style: none; padding: 0; }
        .items li { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .items li:last-child { border-bottom: none; }
        .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Order Confirmed! ✓</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Thank you for your order</p>
        </div>
        <div class="content">
          <div class="card">
            <h2 style="margin-top: 0; color: #10b981;">Order Details</h2>
            ${order.orderNumber ? `<p><strong>Order Number:</strong> ${order.orderNumber}</p>` : ''}
            ${order.deliveryDate ? `<p><strong>Delivery Date:</strong> ${new Date(order.deliveryDate).toLocaleDateString()}</p>` : ''}
            
            <h3>Items Ordered:</h3>
            <ul class="items">
              ${itemsList}
            </ul>
            
            ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ''}
          </div>
          
          <div class="card">
            <h3 style="margin-top: 0;">What's Next?</h3>
            <p>We've received your order and will begin preparing it shortly. You'll receive updates as your order progresses.</p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
          </div>
        </div>
        
        <div class="footer">
          <p>This is an automated confirmation from ${order.company.name}</p>
          <p style="font-size: 12px; color: #9ca3af;">Powered by Plato Kitchen Management</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Order Confirmation

Thank you for your order!

${order.orderNumber ? `Order Number: ${order.orderNumber}` : ''}
${order.deliveryDate ? `Delivery Date: ${new Date(order.deliveryDate).toLocaleDateString()}` : ''}

Items Ordered:
${order.items.map(item => `- ${item.quantity}x ${item.recipe.name}`).join('\n')}

${order.notes ? `Notes: ${order.notes}` : ''}

We've received your order and will begin preparing it shortly.

- ${order.company.name}
  `;

  return { html, text };
}

// Template for order status update email
export function generateOrderStatusEmail(order: {
  orderNumber?: string;
  customer: { name: string };
  company: { name: string };
  status: string;
  items: Array<{ recipe: { name: string }; quantity: number }>;
}) {
  const statusMessages: Record<string, { title: string; message: string; color: string }> = {
    confirmed: {
      title: 'Order Confirmed',
      message: 'Your order has been confirmed and will be prepared soon.',
      color: '#3b82f6',
    },
    in_production: {
      title: 'In Production',
      message: 'We are currently preparing your order.',
      color: '#8b5cf6',
    },
    ready: {
      title: 'Order Ready',
      message: 'Your order is ready for pickup or delivery!',
      color: '#10b981',
    },
    delivered: {
      title: 'Order Delivered',
      message: 'Your order has been delivered. Thank you for your business!',
      color: '#059669',
    },
  };

  const statusInfo = statusMessages[order.status] || {
    title: 'Order Update',
    message: `Your order status: ${order.status}`,
    color: '#6b7280',
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Status Update</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${statusInfo.color}; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px 20px; border-radius: 0 0 8px 8px; }
        .card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">${statusInfo.title}</h1>
        </div>
        <div class="content">
          <div class="card">
            <p>Hi ${order.customer.name},</p>
            <p>${statusInfo.message}</p>
            ${order.orderNumber ? `<p><strong>Order Number:</strong> ${order.orderNumber}</p>` : ''}
          </div>
        </div>
        <div style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px;">
          <p>${order.company.name}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { html, text: `${statusInfo.title}\n\n${statusInfo.message}` };
}
