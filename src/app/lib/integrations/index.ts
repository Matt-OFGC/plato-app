// Base framework
export * from './base/integration-provider';
export * from './base/encryption';
export * from './base/webhook-handler';

// Providers
export * from './ecommerce/shopify-provider';
// TODO: Add other providers
// export * from './accounting/quickbooks-provider';
// export * from './accounting/xero-provider';
// export * from './pos/square-provider';

import { integrationRegistry } from './base/integration-provider';
import { ShopifyProvider } from './ecommerce/shopify-provider';

// Register all providers
integrationRegistry.register('shopify', ShopifyProvider);

// TODO: Register additional providers
// integrationRegistry.register('quickbooks', QuickBooksProvider);
// integrationRegistry.register('xero', XeroProvider);
// integrationRegistry.register('square', SquareProvider);

/**
 * Get all available integrations
 */
export function getAvailableIntegrations() {
  return {
    ecommerce: [
      {
        id: 'shopify',
        name: 'Shopify',
        description: 'Connect your Shopify store to sync products and orders',
        category: 'ecommerce',
        requiresOAuth: true,
        supportedFeatures: ['product-sync', 'order-import', 'inventory-updates'],
      },
      {
        id: 'woocommerce',
        name: 'WooCommerce',
        description: 'Connect your WooCommerce store',
        category: 'ecommerce',
        requiresOAuth: false,
        supportedFeatures: ['product-sync', 'order-import'],
      },
    ],
    accounting: [
      {
        id: 'quickbooks',
        name: 'QuickBooks',
        description: 'Sync invoices and expenses with QuickBooks',
        category: 'accounting',
        requiresOAuth: true,
        supportedFeatures: ['invoice-sync', 'expense-sync', 'payment-tracking'],
      },
      {
        id: 'xero',
        name: 'Xero',
        description: 'Sync accounting data with Xero',
        category: 'accounting',
        requiresOAuth: true,
        supportedFeatures: ['invoice-sync', 'expense-sync', 'bank-reconciliation'],
      },
    ],
    pos: [
      {
        id: 'square',
        name: 'Square',
        description: 'Import sales from Square POS',
        category: 'pos',
        requiresOAuth: true,
        supportedFeatures: ['sales-import', 'inventory-sync'],
      },
      {
        id: 'stripe-pos',
        name: 'Stripe Terminal',
        description: 'Import sales from Stripe Terminal',
        category: 'pos',
        requiresOAuth: true,
        supportedFeatures: ['sales-import'],
      },
    ],
    utilities: [
      {
        id: 'google-sheets',
        name: 'Google Sheets',
        description: 'Import/export data to Google Sheets',
        category: 'utilities',
        requiresOAuth: true,
        supportedFeatures: ['import', 'export', 'scheduled-exports'],
      },
    ],
    email: [
      {
        id: 'mailchimp',
        name: 'Mailchimp',
        description: 'Sync customer data for email marketing',
        category: 'email',
        requiresOAuth: true,
        supportedFeatures: ['customer-sync', 'campaign-triggers'],
      },
    ],
  };
}
