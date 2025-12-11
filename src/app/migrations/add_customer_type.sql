ALTER TABLE "WholesaleCustomer" ADD COLUMN IF NOT EXISTS "customerType" TEXT DEFAULT 'wholesale';
UPDATE "WholesaleCustomer" SET "customerType" = 'wholesale' WHERE "customerType" IS NULL;
