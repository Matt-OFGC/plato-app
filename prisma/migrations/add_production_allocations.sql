-- Add production item allocations table
CREATE TABLE "ProductionItemAllocation" (
  "id" SERIAL PRIMARY KEY,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "productionItemId" INTEGER NOT NULL,
  "customerId" INTEGER,
  "destination" TEXT NOT NULL, -- 'internal', 'wholesale', or custom
  "quantity" DECIMAL(65,30) NOT NULL,
  "notes" TEXT,
  CONSTRAINT "ProductionItemAllocation_productionItemId_fkey" FOREIGN KEY ("productionItemId") REFERENCES "ProductionItem"("id") ON DELETE CASCADE,
  CONSTRAINT "ProductionItemAllocation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "WholesaleCustomer"("id") ON DELETE SET NULL
);

CREATE INDEX "ProductionItemAllocation_productionItemId_idx" ON "ProductionItemAllocation"("productionItemId");
CREATE INDEX "ProductionItemAllocation_customerId_idx" ON "ProductionItemAllocation"("customerId");

