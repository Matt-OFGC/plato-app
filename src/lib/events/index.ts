/**
 * Domain Events System
 * Event-driven communication between modules (bounded contexts)
 * Prevents tight coupling via cross-table reads
 */

import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export enum EventModule {
  RECIPES = 'RECIPES',
  STAFF = 'STAFF',
  WHOLESALE = 'WHOLESALE',
  MESSAGING = 'MESSAGING',
  ANALYTICS = 'ANALYTICS',
}

// Event types (namespaced by module)
export const EventTypes = {
  // Wholesale events
  WHOLESALE_ORDER_RECEIVED: 'wholesale.order.received',
  WHOLESALE_ORDER_CANCELLED: 'wholesale.order.cancelled',
  WHOLESALE_PRICE_UPDATED: 'wholesale.price.updated',

  // Staff events
  STAFF_SHIFT_CREATED: 'staff.shift.created',
  STAFF_SHIFT_UPDATED: 'staff.shift.updated',
  STAFF_SHIFT_DELETED: 'staff.shift.deleted',
  STAFF_SHIFT_FINALISED: 'staff.shift.finalised',
  STAFF_WEEK_FINALISED: 'staff.week.finalised',

  // Recipe events
  RECIPE_INGREDIENT_PRICE_UPDATED: 'recipe.ingredient.price_updated',
  RECIPE_COST_RECALC_REQUIRED: 'recipe.cost_recalc_required',
  RECIPE_CREATED: 'recipe.created',
  RECIPE_UPDATED: 'recipe.updated',

  // Messaging events
  MESSAGE_SENT: 'messaging.message.sent',
  MESSAGE_READ: 'messaging.message.read',
} as const;

export interface DomainEventPayload {
  [key: string]: any;
}

/**
 * Emit a domain event
 * Events are persisted and processed asynchronously
 */
export async function emitEvent(
  eventType: string,
  module: EventModule,
  companyId: number,
  payload: DomainEventPayload,
  options?: {
    userId?: number;
    idempotencyKey?: string;
  }
) {
  try {
    const event = await prisma.domainEvent.create({
      data: {
        eventType,
        module: module as any,
        companyId,
        userId: options?.userId,
        payload: payload as any,
        idempotencyKey: options?.idempotencyKey,
        status: 'pending',
      },
    });

    // Trigger async processing (in background)
    // In production, this would use a job queue (Bull, BullMQ, etc.)
    processEvent(event.id).catch((err) =>
      console.error(`Failed to process event ${event.id}:`, err)
    );

    return event;
  } catch (error) {
    // If it's a duplicate idempotency key, silently ignore
    if (
      error instanceof Error &&
      error.message.includes('Unique constraint failed')
    ) {
      console.log(`Event with idempotencyKey ${options?.idempotencyKey} already exists`);
      return null;
    }
    throw error;
  }
}

/**
 * Process a domain event
 * Routes to appropriate handler based on event type
 */
async function processEvent(eventId: number) {
  const event = await prisma.domainEvent.findUnique({
    where: { id: eventId },
  });

  if (!event || event.status !== 'pending') return;

  // Mark as processing
  await prisma.domainEvent.update({
    where: { id: eventId },
    data: { status: 'processing' },
  });

  try {
    // Route to handler
    await routeEvent(event.eventType, event.companyId, event.payload as any);

    // Mark as completed
    await prisma.domainEvent.update({
      where: { id: eventId },
      data: {
        status: 'completed',
        processedAt: new Date(),
      },
    });
  } catch (error) {
    // Mark as failed and increment retry count
    await prisma.domainEvent.update({
      where: { id: eventId },
      data: {
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        retryCount: { increment: 1 },
      },
    });

    // Retry logic (max 3 retries)
    const updatedEvent = await prisma.domainEvent.findUnique({
      where: { id: eventId },
    });

    if (updatedEvent && updatedEvent.retryCount < 3) {
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, updatedEvent.retryCount) * 1000;
      setTimeout(() => processEvent(eventId), delay);
    }
  }
}

/**
 * Route event to appropriate handler
 */
async function routeEvent(
  eventType: string,
  companyId: number,
  payload: DomainEventPayload
) {
  switch (eventType) {
    case EventTypes.WHOLESALE_ORDER_RECEIVED:
      await handleWholesaleOrderReceived(companyId, payload);
      break;

    case EventTypes.STAFF_WEEK_FINALISED:
      await handleStaffWeekFinalised(companyId, payload);
      break;

    case EventTypes.RECIPE_INGREDIENT_PRICE_UPDATED:
      await handleIngredientPriceUpdated(companyId, payload);
      break;

    // Add more handlers as needed
    default:
      console.log(`No handler for event type: ${eventType}`);
  }
}

// ============================================
// EVENT HANDLERS
// ============================================

/**
 * Handle wholesale.order.received
 * → Update inventory levels
 */
async function handleWholesaleOrderReceived(
  companyId: number,
  payload: DomainEventPayload
) {
  console.log('Handling wholesale order received:', payload);

  // TODO: Implement inventory delta logic
  // This would:
  // 1. Read payload.orderItems
  // 2. Update Inventory table quantities
  // 3. Create InventoryTransaction records

  // Example:
  // await prisma.inventory.update({
  //   where: { ingredientId_companyId: { ingredientId: payload.ingredientId, companyId } },
  //   data: { quantity: { increment: payload.quantity } }
  // });
}

/**
 * Handle staff.week.finalised
 * → Emit payroll summary
 */
async function handleStaffWeekFinalised(
  companyId: number,
  payload: DomainEventPayload
) {
  console.log('Handling staff week finalised:', payload);

  // TODO: Calculate payroll totals
  // This would:
  // 1. Sum all shift hours for the week
  // 2. Apply pay rates
  // 3. Create or update PayrollRun record
  // 4. Optionally emit to external payroll system
}

/**
 * Handle recipe.ingredient.price_updated
 * → Trigger recipe cost recalculation
 */
async function handleIngredientPriceUpdated(
  companyId: number,
  payload: DomainEventPayload
) {
  console.log('Handling ingredient price updated:', payload);

  // TODO: Recalculate affected recipes
  // This would:
  // 1. Find all recipes using this ingredient
  // 2. Recalculate their totalCost
  // 3. Update Recipe records
  // 4. Optionally emit recipe.cost_updated events
}

/**
 * Get pending events for manual processing/debugging
 */
export async function getPendingEvents(companyId?: number) {
  return prisma.domainEvent.findMany({
    where: {
      status: 'pending',
      companyId,
    },
    orderBy: { createdAt: 'asc' },
    take: 100,
  });
}

/**
 * Get failed events for debugging/retry
 */
export async function getFailedEvents(companyId?: number) {
  return prisma.domainEvent.findMany({
    where: {
      status: 'failed',
      companyId,
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

/**
 * Retry a failed event
 */
export async function retryEvent(eventId: number) {
  await prisma.domainEvent.update({
    where: { id: eventId },
    data: {
      status: 'pending',
      error: null,
    },
  });

  return processEvent(eventId);
}
