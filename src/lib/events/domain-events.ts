// Domain Events System for Cross-App Communication
// Handles event emission, processing, and retry logic

import { prisma } from '../prisma';

export enum EventTypes {
  // Wholesale Events
  PURCHASE_ORDER_RECEIVED = 'purchase_order.received',
  PURCHASE_ORDER_CREATED = 'purchase_order.created',
  WHOLESALE_ORDER_RECEIVED = 'wholesale.order.received',
  WHOLESALE_ORDER_CONFIRMED = 'wholesale.order.confirmed',
  
  // Recipe Events
  RECIPE_CREATED = 'recipe.created',
  RECIPE_UPDATED = 'recipe.updated',
  RECIPE_DELETED = 'recipe.deleted',
  INGREDIENT_PRICE_UPDATED = 'ingredient.price_updated',
  
  // Staff Events
  STAFF_WEEK_FINALIZED = 'staff.week.finalized',
  STAFF_WEEK_COPIED = 'staff.week.copied',
  SHIFT_CREATED = 'shift.created',
  SHIFT_UPDATED = 'shift.updated',
  
  // Inventory Events
  INVENTORY_LOW_STOCK = 'inventory.low_stock',
  INVENTORY_UPDATED = 'inventory.updated',
  
  // Message Events
  MESSAGE_SENT = 'message.sent',
  CHANNEL_CREATED = 'channel.created',
  CHANNEL_JOINED = 'channel.joined',
  
  // System Events
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',
  COMPANY_UPDATED = 'company.updated',
}

interface EventPayload {
  [key: string]: any;
}

interface EventMetadata {
  userId?: number;
  source?: string;
  timestamp?: Date;
  [key: string]: any;
}

export interface DomainEvent {
  id: number;
  eventType: EventTypes;
  companyId: number;
  payload: EventPayload;
  metadata: EventMetadata;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  createdAt: Date;
  processedAt?: Date;
  failedAt?: Date;
  error?: string;
}

// Emit a domain event
export async function emitEvent(
  eventType: EventTypes,
  payload: EventPayload,
  companyId: number,
  metadata: EventMetadata = {}
): Promise<DomainEvent> {
  try {
    const event = await prisma.domainEvent.create({
      data: {
        eventType,
        companyId,
        payload,
        metadata: {
          ...metadata,
          timestamp: metadata.timestamp || new Date(),
        },
        status: 'pending',
        retryCount: 0,
      },
    });

    console.log(`[DomainEvent] Emitted event: ${eventType} (ID: ${event.id})`);
    
    // Trigger WebSocket broadcast if available
    await broadcastEvent(event);
    
    return event;
  } catch (error) {
    console.error(`[DomainEvent] Failed to emit event ${eventType}:`, error);
    throw error;
  }
}

// Process a domain event
export async function processEvent(eventId: number): Promise<void> {
  const event = await prisma.domainEvent.findUnique({ 
    where: { id: eventId } 
  });

  if (!event) {
    console.warn(`[DomainEvent] Event ${eventId} not found for processing.`);
    return;
  }

  if (event.status !== 'pending' && event.status !== 'failed') {
    console.log(`[DomainEvent] Event ${eventId} already processed or in progress.`);
    return;
  }

  try {
    // Mark as processing
    await prisma.domainEvent.update({
      where: { id: eventId },
      data: { status: 'processing' },
    });

    console.log(`[DomainEvent] Processing event ${event.eventType} (ID: ${event.id})`);
    
    // Process based on event type
    await handleEvent(event);
    
    // Mark as completed
    await prisma.domainEvent.update({
      where: { id: eventId },
      data: { 
        status: 'completed', 
        processedAt: new Date() 
      },
    });
    
    console.log(`[DomainEvent] Successfully processed event ${event.eventType} (ID: ${event.id})`);
  } catch (error) {
    console.error(`[DomainEvent] Error processing event ${event.eventType} (ID: ${event.id}):`, error);
    
    const newRetryCount = event.retryCount + 1;
    const newStatus = newRetryCount >= 3 ? 'failed' : 'pending';

    await prisma.domainEvent.update({
      where: { id: eventId },
      data: {
        status: newStatus,
        retryCount: newRetryCount,
        error: error instanceof Error ? error.message : String(error),
        failedAt: newStatus === 'failed' ? new Date() : null,
      },
    });
  }
}

// Handle specific event types
async function handleEvent(event: DomainEvent): Promise<void> {
  switch (event.eventType) {
    case EventTypes.PURCHASE_ORDER_RECEIVED:
      await handlePurchaseOrderReceived(event);
      break;
      
    case EventTypes.WHOLESALE_ORDER_RECEIVED:
      await handleWholesaleOrderReceived(event);
      break;
      
    case EventTypes.INGREDIENT_PRICE_UPDATED:
      await handleIngredientPriceUpdated(event);
      break;
      
    case EventTypes.INVENTORY_LOW_STOCK:
      await handleInventoryLowStock(event);
      break;
      
    case EventTypes.STAFF_WEEK_FINALIZED:
      await handleStaffWeekFinalized(event);
      break;
      
    case EventTypes.MESSAGE_SENT:
      await handleMessageSent(event);
      break;
      
    default:
      console.warn(`[DomainEvent] No handler for event type: ${event.eventType}`);
  }
}

// Event handlers
async function handlePurchaseOrderReceived(event: DomainEvent): Promise<void> {
  const { orderId, supplierId, items } = event.payload;
  
  console.log(`[DomainEvent] Handling PURCHASE_ORDER_RECEIVED for order ${orderId}`);
  
  // Update inventory levels
  for (const item of items) {
    await prisma.ingredient.update({
      where: { id: item.ingredientId },
      data: {
        packPrice: item.unitPrice,
        lastPriceUpdate: new Date(),
      },
    });
  }
  
  // Emit inventory updated event
  await emitEvent(EventTypes.INVENTORY_UPDATED, {
    orderId,
    items: items.map((item: any) => ({
      ingredientId: item.ingredientId,
      quantity: item.quantity,
      price: item.unitPrice,
    })),
  }, event.companyId, {
    source: 'purchase_order_handler',
    userId: event.metadata.userId,
  });
}

async function handleWholesaleOrderReceived(event: DomainEvent): Promise<void> {
  const { orderId, items, deliveryDate } = event.payload;
  
  console.log(`[DomainEvent] Handling WHOLESALE_ORDER_RECEIVED for order ${orderId}`);
  
  // Create production plan
  // This would integrate with the recipe app to create production schedules
  console.log(`[DomainEvent] Would create production plan for ${items.length} items`);
}

async function handleIngredientPriceUpdated(event: DomainEvent): Promise<void> {
  const { ingredientId, oldPrice, newPrice, changePercent } = event.payload;
  
  console.log(`[DomainEvent] Handling INGREDIENT_PRICE_UPDATED for ingredient ${ingredientId}`);
  
  // If price change is significant (>10%), notify relevant users
  if (changePercent > 10) {
    await emitEvent(EventTypes.MESSAGE_SENT, {
      channelId: 'pricing-alerts', // This would be a system channel
      content: `⚠️ Price alert: Ingredient ${ingredientId} increased by ${changePercent.toFixed(1)}% (${oldPrice} → ${newPrice})`,
      type: 'system',
    }, event.companyId, {
      source: 'ingredient_price_handler',
      userId: event.metadata.userId,
    });
  }
}

async function handleInventoryLowStock(event: DomainEvent): Promise<void> {
  const { ingredientId, currentStock, reorderPoint, supplierId } = event.payload;
  
  console.log(`[DomainEvent] Handling INVENTORY_LOW_STOCK for ingredient ${ingredientId}`);
  
  // Create draft purchase order
  // This would integrate with the wholesale app
  console.log(`[DomainEvent] Would create draft PO for ingredient ${ingredientId}`);
  
  // Notify purchasing team
  await emitEvent(EventTypes.MESSAGE_SENT, {
    channelId: 'purchasing',
    content: `📦 Low stock alert: Ingredient ${ingredientId} (${currentStock} remaining, reorder at ${reorderPoint})`,
    type: 'system',
  }, event.companyId, {
    source: 'inventory_handler',
  });
}

async function handleStaffWeekFinalized(event: DomainEvent): Promise<void> {
  const { weekStart, totalHours, staffCount } = event.payload;
  
  console.log(`[DomainEvent] Handling STAFF_WEEK_FINALIZED for week ${weekStart}`);
  
  // Check if capacity can handle pending wholesale orders
  // This would integrate with the wholesale app
  console.log(`[DomainEvent] Would check wholesale capacity for ${staffCount} staff, ${totalHours} hours`);
}

async function handleMessageSent(event: DomainEvent): Promise<void> {
  const { channelId, content, type } = event.payload;
  
  console.log(`[DomainEvent] Handling MESSAGE_SENT in channel ${channelId}`);
  
  // This would integrate with the messaging app for real-time updates
  console.log(`[DomainEvent] Would broadcast message to channel ${channelId}`);
}

// Broadcast event via WebSocket
async function broadcastEvent(event: DomainEvent): Promise<void> {
  try {
    // This would integrate with Socket.io to broadcast to relevant users
    // For now, just log
    console.log(`[DomainEvent] Would broadcast event ${event.eventType} to company ${event.companyId}`);
  } catch (error) {
    console.error(`[DomainEvent] Failed to broadcast event ${event.id}:`, error);
  }
}

// Get pending events for processing
export async function getPendingEvents(limit: number = 100): Promise<DomainEvent[]> {
  return await prisma.domainEvent.findMany({
    where: {
      status: 'pending',
      retryCount: { lt: 3 },
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });
}

// Get failed events for manual review
export async function getFailedEvents(limit: number = 100): Promise<DomainEvent[]> {
  return await prisma.domainEvent.findMany({
    where: {
      status: 'failed',
    },
    orderBy: { failedAt: 'desc' },
    take: limit,
  });
}

// Retry failed events
export async function retryFailedEvents(): Promise<void> {
  const failedEvents = await getFailedEvents(50);
  
  for (const event of failedEvents) {
    await processEvent(event.id);
  }
}

// Clean up old completed events
export async function cleanupOldEvents(daysOld: number = 30): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const result = await prisma.domainEvent.deleteMany({
    where: {
      status: 'completed',
      processedAt: { lt: cutoffDate },
    },
  });
  
  console.log(`[DomainEvent] Cleaned up ${result.count} old events`);
  return result.count;
}

// Event statistics
export async function getEventStats(companyId: number): Promise<{
  total: number;
  pending: number;
  completed: number;
  failed: number;
  byType: Record<string, number>;
}> {
  const [total, pending, completed, failed] = await Promise.all([
    prisma.domainEvent.count({ where: { companyId } }),
    prisma.domainEvent.count({ where: { companyId, status: 'pending' } }),
    prisma.domainEvent.count({ where: { companyId, status: 'completed' } }),
    prisma.domainEvent.count({ where: { companyId, status: 'failed' } }),
  ]);
  
  const byType = await prisma.domainEvent.groupBy({
    by: ['eventType'],
    where: { companyId },
    _count: { eventType: true },
  });
  
  return {
    total,
    pending,
    completed,
    failed,
    byType: byType.reduce((acc, item) => {
      acc[item.eventType] = item._count.eventType;
      return acc;
    }, {} as Record<string, number>),
  };
}