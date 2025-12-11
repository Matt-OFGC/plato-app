-- Add customerType field to WholesaleCustomer table
-- Default existing customers to 'wholesale' for backward compatibility

ALTER TABLE "WholesaleCustomer" ADD COLUMN IF NOT EXISTS "customerType" TEXT DEFAULT 'wholesale';

-- Set all existing customers to 'wholesale' if they don't have a value
UPDATE "WholesaleCustomer" SET "customerType" = 'wholesale' WHERE "customerType" IS NULL;

