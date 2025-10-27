import { prisma } from "@/lib/prisma";

export enum EventTypes {
  // Wholesale events
  WHOLESALE_ORDER_RECEIVED = 'wholesale.order.received',
  PURCHASE_ORDER_RECEIVED = 'purchase_order.received',
  INVENTORY_LOW_STOCK = 'inventory.low_stock',
  
  // Recipe events
  RECIPE_INGREDIENT_PRICE_UPDATED = 'recipe.ingredient.price_updated',
  
  // Staff events
  STAFF_WEEK_FINALISED = 'staff.week.finalised',
  STAFF_WEEK_COPIED = 'staff.week.copied',
  
  // General events
  COMPANY_CREATED = 'company.created',
  USER_REGISTERED = 'user.registered',
}

export interface DomainEvent {
  eventType: EventTypes;
  companyId: number;
  payload: Record<string, any>;
  metadata?: {
    userId?: number;
    source?: string;
    timestamp?: Date;
  };
}

export class DomainEventBus {
  private static instance: DomainEventBus;
  
  private constructor() {}
  
  public static getInstance(): DomainEventBus {
    if (!DomainEventBus.instance) {
      DomainEventBus.instance = new DomainEventBus();
    }
    return DomainEventBus.instance;
  }

  /**
   * Emit a domain event
   * Events are persisted to the database and processed asynchronously
   */
  async emit(event: DomainEvent): Promise<void> {
    try {
      // Persist the event to the database
      await prisma.domainEvent.create({
        data: {
          eventType: event.eventType,
          companyId: event.companyId,
          payload: event.payload,
          metadata: event.metadata || {},
          status: 'pending',
          retryCount: 0,
        },
      });

      // Process the event asynchronously
      this.processEvent(event).catch(error => {
        console.error(`Failed to process event ${event.eventType}:`, error);
      });
    } catch (error) {
      console.error(`Failed to emit event ${event.eventType}:`, error);
      throw error;
    }
  }

  /**
   * Process a domain event
   * This method handles the actual business logic for each event type
   */
  private async processEvent(event: DomainEvent): Promise<void> {
    try {
      switch (event.eventType) {
        case EventTypes.PURCHASE_ORDER_RECEIVED:
          await this.handlePurchaseOrderReceived(event);
          break;
        
        case EventTypes.INVENTORY_LOW_STOCK:
          await this.handleInventoryLowStock(event);
          break;
        
        case EventTypes.RECIPE_INGREDIENT_PRICE_UPDATED:
          await this.handleRecipeIngredientPriceUpdated(event);
          break;
        
        case EventTypes.STAFF_WEEK_FINALISED:
          await this.handleStaffWeekFinalised(event);
          break;
        
        case EventTypes.WHOLESALE_ORDER_RECEIVED:
          await this.handleWholesaleOrderReceived(event);
          break;
        
        default:
          console.log(`Unhandled event type: ${event.eventType}`);
      }

      // Mark event as processed
      await this.markEventProcessed(event.eventType, event.companyId);
    } catch (error) {
      console.error(`Error processing event ${event.eventType}:`, error);
      await this.markEventFailed(event.eventType, event.companyId, error);
    }
  }

  /**
   * Handle purchase order received - update inventory
   */
  private async handlePurchaseOrderReceived(event: DomainEvent): Promise<void> {
    const { orderId, supplierId, items } = event.payload;
    
    console.log(`Processing purchase order received: ${orderId}`);
    
    // Update inventory for each item
    for (const item of items) {
      const { ingredientId, quantity, unitPrice } = item;
      
      // Get current ingredient
      const ingredient = await prisma.ingredient.findUnique({
        where: { id: ingredientId },
      });
      
      if (!ingredient) {
        console.warn(`Ingredient ${ingredientId} not found`);
        continue;
      }
      
      // Check if price changed significantly (>10%)
      const oldPrice = Number(ingredient.packPrice);
      const priceChange = Math.abs(unitPrice - oldPrice) / oldPrice;
      
      if (priceChange > 0.1) {
        // Emit price update event
        await this.emit({
          eventType: EventTypes.RECIPE_INGREDIENT_PRICE_UPDATED,
          companyId: event.companyId,
          payload: {
            ingredientId,
            oldPrice,
            newPrice: unitPrice,
            variance: priceChange * 100,
            source: 'purchase_order',
          },
          metadata: {
            source: 'purchase_order',
            timestamp: new Date(),
          },
        });
      }
      
      // Update ingredient price
      await prisma.ingredient.update({
        where: { id: ingredientId },
        data: {
          packPrice: unitPrice,
          lastPriceUpdate: new Date(),
        },
      });
      
      // Update inventory if it exists
      const inventory = await prisma.inventory.findFirst({
        where: {
          ingredientId,
          companyId: event.companyId,
        },
      });
      
      if (inventory) {
        await prisma.inventory.update({
          where: { id: inventory.id },
          data: {
            quantity: inventory.quantity + quantity,
            lastUpdated: new Date(),
          },
        });
      } else {
        // Create new inventory record
        await prisma.inventory.create({
          data: {
            ingredientId,
            companyId: event.companyId,
            quantity,
            unit: ingredient.packUnit,
            lastUpdated: new Date(),
          },
        });
      }
    }
    
    console.log(`✅ Purchase order ${orderId} processed - inventory updated`);
  }

  /**
   * Handle inventory low stock - create purchase order suggestion
   */
  private async handleInventoryLowStock(event: DomainEvent): Promise<void> {
    const { ingredientId, currentStock, reorderPoint, supplierId } = event.payload;
    
    console.log(`Processing low stock alert for ingredient ${ingredientId}`);
    
    // Create notification for purchasing team
    const companyMembers = await prisma.membership.findMany({
      where: {
        companyId: event.companyId,
        isActive: true,
        role: { in: ['OWNER', 'ADMIN', 'EDITOR'] },
      },
      select: { userId: true },
    });
    
    if (companyMembers.length > 0) {
      await prisma.notification.createMany({
        data: companyMembers.map(member => ({
          userId: member.userId,
          type: 'inventory_low_stock',
          title: 'Low Stock Alert',
          message: `Ingredient ${ingredientId} is below reorder point (${currentStock}/${reorderPoint})`,
          link: `/dashboard/wholesale/purchase-orders`,
        })),
      });
    }
    
    console.log(`✅ Low stock alert processed for ingredient ${ingredientId}`);
  }

  /**
   * Handle recipe ingredient price updated - recalculate recipe costs
   */
  private async handleRecipeIngredientPriceUpdated(event: DomainEvent): Promise<void> {
    const { ingredientId, oldPrice, newPrice, variance } = event.payload;
    
    console.log(`Processing ingredient price update: ${ingredientId} (${oldPrice} → ${newPrice})`);
    
    // Find all recipes that use this ingredient
    const recipes = await prisma.recipe.findMany({
      where: {
        companyId: event.companyId,
        items: {
          some: {
            ingredientId,
          },
        },
      },
      include: {
        items: {
          where: {
            ingredientId,
          },
        },
      },
    });
    
    // Recalculate costs for affected recipes
    for (const recipe of recipes) {
      const ingredientItem = recipe.items[0];
      if (!ingredientItem) continue;
      
      const priceDifference = newPrice - oldPrice;
      const quantityUsed = Number(ingredientItem.quantity);
      const costImpact = priceDifference * quantityUsed;
      
      // Update recipe's actual food cost
      const currentFoodCost = Number(recipe.actualFoodCost || 0);
      const newFoodCost = currentFoodCost + costImpact;
      
      await prisma.recipe.update({
        where: { id: recipe.id },
        data: {
          actualFoodCost: newFoodCost,
          lastPriceUpdate: new Date(),
        },
      });
    }
    
    console.log(`✅ Recipe costs updated for ${recipes.length} recipes using ingredient ${ingredientId}`);
  }

  /**
   * Handle staff week finalised - check production capacity
   */
  private async handleStaffWeekFinalised(event: DomainEvent): Promise<void> {
    const { weekStart, totalHours, staffCount } = event.payload;
    
    console.log(`Processing staff week finalised: ${weekStart} (${totalHours}h, ${staffCount} staff)`);
    
    // Check if there are pending wholesale orders for this week
    const weekStartDate = new Date(weekStart);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 7);
    
    const pendingOrders = await prisma.wholesaleOrder.findMany({
      where: {
        companyId: event.companyId,
        status: { in: ['pending', 'confirmed'] },
        deliveryDate: {
          gte: weekStartDate,
          lte: weekEndDate,
        },
      },
      include: {
        items: true,
      },
    });
    
    if (pendingOrders.length > 0) {
      // Calculate total production hours needed
      const totalProductionHours = pendingOrders.reduce((sum, order) => {
        return sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
      }, 0);
      
      // Check if understaffed (assuming 1 hour per unit produced)
      if (totalProductionHours > totalHours) {
        const companyMembers = await prisma.membership.findMany({
          where: {
            companyId: event.companyId,
            isActive: true,
            role: { in: ['OWNER', 'ADMIN'] },
          },
          select: { userId: true },
        });
        
        if (companyMembers.length > 0) {
          await prisma.notification.createMany({
            data: companyMembers.map(member => ({
              userId: member.userId,
              type: 'production_capacity_warning',
              title: 'Production Capacity Warning',
              message: `Week ${weekStart} may be understaffed. ${totalProductionHours}h needed vs ${totalHours}h scheduled.`,
              link: `/dashboard/staff`,
            })),
          });
        }
      }
    }
    
    console.log(`✅ Staff week finalised processed for ${weekStart}`);
  }

  /**
   * Handle wholesale order received - create production plan
   */
  private async handleWholesaleOrderReceived(event: DomainEvent): Promise<void> {
    const { orderId, items, deliveryDate } = event.payload;
    
    console.log(`Processing wholesale order received: ${orderId}`);
    
    // Create production plan for the order
    const productionPlan = await prisma.productionPlan.create({
      data: {
        name: `Order ${orderId}`,
        startDate: new Date(),
        endDate: new Date(deliveryDate),
        companyId: event.companyId,
        createdBy: event.metadata?.userId || 0,
        items: {
          create: items.map((item: any) => ({
            recipeId: item.recipeId,
            quantity: item.quantity,
            priority: 1,
          })),
        },
      },
    });
    
    console.log(`✅ Production plan created for wholesale order ${orderId}`);
  }

  /**
   * Mark event as processed
   */
  private async markEventProcessed(eventType: string, companyId: number): Promise<void> {
    await prisma.domainEvent.updateMany({
      where: {
        eventType,
        companyId,
        status: 'pending',
      },
      data: {
        status: 'processed',
        processedAt: new Date(),
      },
    });
  }

  /**
   * Mark event as failed and increment retry count
   */
  private async markEventFailed(eventType: string, companyId: number, error: any): Promise<void> {
    await prisma.domainEvent.updateMany({
      where: {
        eventType,
        companyId,
        status: 'pending',
      },
      data: {
        status: 'failed',
        retryCount: { increment: 1 },
        error: error.message || 'Unknown error',
        failedAt: new Date(),
      },
    });
  }

  /**
   * Retry failed events (for background job)
   */
  async retryFailedEvents(): Promise<void> {
    const failedEvents = await prisma.domainEvent.findMany({
      where: {
        status: 'failed',
        retryCount: { lt: 3 }, // Max 3 retries
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    for (const event of failedEvents) {
      try {
        await this.processEvent({
          eventType: event.eventType as EventTypes,
          companyId: event.companyId,
          payload: event.payload as Record<string, any>,
          metadata: event.metadata as any,
        });
      } catch (error) {
        console.error(`Retry failed for event ${event.id}:`, error);
      }
    }
  }
}

// Export singleton instance
export const eventBus = DomainEventBus.getInstance();

// Convenience function for emitting events
export async function emitEvent(eventType: EventTypes, payload: Record<string, any>, companyId: number, metadata?: any): Promise<void> {
  await eventBus.emit({
    eventType,
    companyId,
    payload,
    metadata,
  });
}
