-- Add missing fields to WholesaleCustomer table
-- These fields are used in the customer form but were missing from the schema

ALTER TABLE "WholesaleCustomer" 
ADD COLUMN IF NOT EXISTS "openingHours" JSONB,
ADD COLUMN IF NOT EXISTS "deliveryDays" TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "preferredDeliveryTime" TEXT,
ADD COLUMN IF NOT EXISTS "paymentTerms" TEXT,
ADD COLUMN IF NOT EXISTS "creditLimit" DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS "taxId" TEXT,
ADD COLUMN IF NOT EXISTS "accountManager" TEXT,
ADD COLUMN IF NOT EXISTS "specialInstructions" TEXT,
ADD COLUMN IF NOT EXISTS "orderFrequency" TEXT;

-- Add index on commonly queried fields
CREATE INDEX IF NOT EXISTS "WholesaleCustomer_deliveryDays_idx" ON "WholesaleCustomer" USING GIN ("deliveryDays");
