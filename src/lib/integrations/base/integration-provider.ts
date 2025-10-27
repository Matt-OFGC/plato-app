export interface IntegrationConfig {
  id: number;
  companyId: number;
  provider: string;
  name: string;
  credentials: any;
  authType: string;
  settings?: any;
  isActive: boolean;
  isConnected: boolean;
  lastSyncAt?: Date;
  lastErrorAt?: Date;
  lastError?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsFailed: number;
  errors?: any[];
  warnings?: any[];
}

export interface WebhookEvent {
  provider: string;
  eventType: string;
  data: any;
  timestamp: Date;
}

/**
 * Abstract base class for all integrations
 */
export abstract class IntegrationProvider {
  protected config: IntegrationConfig;

  constructor(config: IntegrationConfig) {
    this.config = config;
  }

  /**
   * Get the provider name
   */
  abstract getProviderName(): string;

  /**
   * Test the connection to the external service
   */
  abstract testConnection(): Promise<{ success: boolean; error?: string }>;

  /**
   * Connect to the external service (OAuth or API key)
   */
  abstract connect(credentials?: any): Promise<{ success: boolean; data?: any; error?: string }>;

  /**
   * Disconnect from the external service
   */
  abstract disconnect(): Promise<{ success: boolean; error?: string }>;

  /**
   * Sync data from external service
   */
  abstract sync(direction: 'import' | 'export' | 'bidirectional'): Promise<SyncResult>;

  /**
   * Handle incoming webhook
   */
  abstract handleWebhook(event: WebhookEvent): Promise<{ success: boolean; data?: any; error?: string }>;

  /**
   * Refresh OAuth token if needed
   */
  async refreshToken(): Promise<{ success: boolean; accessToken?: string; error?: string }> {
    // Default implementation - overridden by providers that need token refresh
    return { success: false, error: "Token refresh not implemented" };
  }

  /**
   * Get connection status
   */
  async getStatus(): Promise<{
    connected: boolean;
    lastSync?: Date;
    lastError?: string;
    health: 'healthy' | 'degraded' | 'error';
  }> {
    const connected = this.config.isConnected;
    const health = this.config.lastErrorAt && this.config.lastErrorAt > new Date(Date.now() - 3600000)
      ? 'error'
      : connected
        ? 'healthy'
        : 'degraded';

    return {
      connected,
      lastSync: this.config.lastSyncAt || undefined,
      lastError: this.config.lastError || undefined,
      health,
    };
  }

  /**
   * Validate credentials
   */
  protected validateCredentials(credentials: any): { valid: boolean; error?: string } {
    if (!credentials) {
      return { valid: false, error: "Credentials are required" };
    }
    return { valid: true };
  }

  /**
   * Log sync result
   */
  protected logSyncResult(result: SyncResult, integrationId: number): void {
    console.log(`[${this.getProviderName()}] Sync result:`, {
      integrationId,
      success: result.success,
      recordsProcessed: result.recordsProcessed,
      recordsCreated: result.recordsCreated,
      recordsUpdated: result.recordsUpdated,
      recordsFailed: result.recordsFailed,
    });
  }
}

/**
 * Integration registry
 */
export class IntegrationRegistry {
  private providers: Map<string, new (config: IntegrationConfig) => IntegrationProvider> = new Map();

  register(name: string, providerClass: new (config: IntegrationConfig) => IntegrationProvider): void {
    this.providers.set(name, providerClass);
  }

  create(name: string, config: IntegrationConfig): IntegrationProvider | null {
    const ProviderClass = this.providers.get(name);
    if (!ProviderClass) {
      return null;
    }
    return new ProviderClass(config);
  }

  getRegisteredProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}

// Global registry instance
export const integrationRegistry = new IntegrationRegistry();
