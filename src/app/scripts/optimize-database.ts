import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

async function optimizeDatabase() {
  console.log('Adding performance indexes...');
  
  try {
    // Add indexes for common queries
    await prisma.$executeRaw`
      -- Additional indexes for performance
      
      -- Inventory queries
      CREATE INDEX IF NOT EXISTS idx_inventory_company_recipe 
      ON "Inventory"(companyId, recipeId);
      
      -- Production plan queries
      CREATE INDEX IF NOT EXISTS idx_production_plan_company_dates 
      ON "ProductionPlan"(companyId, startDate, endDate);
      
      -- Production task queries
      CREATE INDEX IF NOT EXISTS idx_production_task_plan 
      ON "ProductionTask"(planId);
      
      -- Wholesale order queries
      CREATE INDEX IF NOT EXISTS idx_wholesale_order_customer 
      ON "WholesaleOrder"(customerId);
      
      CREATE INDEX IF NOT EXISTS idx_wholesale_order_company_status 
      ON "WholesaleOrder"(companyId, status);
      
      -- Membership queries
      CREATE INDEX IF NOT EXISTS idx_membership_user_active 
      ON "Membership"(userId, isActive) WHERE isActive = true;
      
      -- Activity log queries (for admin dashboard)
      CREATE INDEX IF NOT EXISTS idx_activity_log_company_created 
      ON "ActivityLog"(companyId, createdAt DESC);
      
      -- Sales record queries
      CREATE INDEX IF NOT EXISTS idx_sales_record_recipe_date 
      ON "SalesRecord"(recipeId, date DESC);
      
      -- Category queries with color
      CREATE INDEX IF NOT EXISTS idx_category_company 
      ON "Category"(companyId);
      
      -- Supplier queries
      CREATE INDEX IF NOT EXISTS idx_supplier_company 
      ON "Supplier"(companyId);
      
      -- Storage and shelf life options
      CREATE INDEX IF NOT EXISTS idx_storage_option_company 
      ON "StorageOption"(companyId);
      
      CREATE INDEX IF NOT EXISTS idx_shelf_life_option_company 
      ON "ShelfLifeOption"(companyId);
    `;
    
    console.log('✅ Database indexes added successfully');
  } catch (error) {
    console.error('Error adding indexes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

optimizeDatabase();
