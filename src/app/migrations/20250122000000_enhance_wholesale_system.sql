-- Enhance Wholesale System
-- This migration adds comprehensive customer fields, invoicing, delivery notes, and payment tracking

-- Add new fields to WholesaleCustomer
ALTER TABLE "WholesaleCustomer" 
ADD COLUMN IF NOT EXISTS "openingHours" JSONB,
ADD COLUMN IF NOT EXISTS "deliveryDays" TEXT[],
ADD COLUMN IF NOT EXISTS "preferredDeliveryTime" TEXT,
ADD COLUMN IF NOT EXISTS "paymentTerms" TEXT,
ADD COLUMN IF NOT EXISTS "creditLimit" DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS "taxId" TEXT,
ADD COLUMN IF NOT EXISTS "accountManager" TEXT,
ADD COLUMN IF NOT EXISTS "specialInstructions" TEXT,
ADD COLUMN IF NOT EXISTS "orderFrequency" TEXT,
ADD COLUMN IF NOT EXISTS "lastOrderDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "totalOrders" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "totalValue" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "totalPaid" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "outstandingBalance" DECIMAL(10,2) DEFAULT 0;

-- Create WholesaleInvoice table
CREATE TABLE IF NOT EXISTS "WholesaleInvoice" (
  "id" SERIAL PRIMARY KEY,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "invoiceNumber" TEXT UNIQUE NOT NULL,
  "orderId" INTEGER,
  "customerId" INTEGER NOT NULL,
  "companyId" INTEGER NOT NULL,
  "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "subtotal" DECIMAL(10,2) NOT NULL,
  "taxRate" DECIMAL(5,2) DEFAULT 0,
  "taxAmount" DECIMAL(10,2) DEFAULT 0,
  "total" DECIMAL(10,2) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "paidDate" TIMESTAMP(3),
  "paidAmount" DECIMAL(10,2),
  "notes" TEXT,
  "pdfUrl" TEXT,
  "emailSent" BOOLEAN DEFAULT FALSE,
  "emailSentAt" TIMESTAMP(3),
  CONSTRAINT "WholesaleInvoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "WholesaleCustomer"("id") ON DELETE CASCADE,
  CONSTRAINT "WholesaleInvoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE,
  CONSTRAINT "WholesaleInvoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "WholesaleOrder"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "WholesaleInvoice_customerId_idx" ON "WholesaleInvoice"("customerId");
CREATE INDEX IF NOT EXISTS "WholesaleInvoice_companyId_idx" ON "WholesaleInvoice"("companyId");
CREATE INDEX IF NOT EXISTS "WholesaleInvoice_orderId_idx" ON "WholesaleInvoice"("orderId");
CREATE INDEX IF NOT EXISTS "WholesaleInvoice_status_idx" ON "WholesaleInvoice"("status");
CREATE INDEX IF NOT EXISTS "WholesaleInvoice_dueDate_idx" ON "WholesaleInvoice"("dueDate");
CREATE INDEX IF NOT EXISTS "WholesaleInvoice_invoiceNumber_idx" ON "WholesaleInvoice"("invoiceNumber");

-- Create WholesaleDeliveryNote table
CREATE TABLE IF NOT EXISTS "WholesaleDeliveryNote" (
  "id" SERIAL PRIMARY KEY,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deliveryNoteNumber" TEXT UNIQUE NOT NULL,
  "orderId" INTEGER NOT NULL,
  "customerId" INTEGER NOT NULL,
  "companyId" INTEGER NOT NULL,
  "deliveryDate" TIMESTAMP(3) NOT NULL,
  "deliveredBy" TEXT,
  "signature" TEXT,
  "notes" TEXT,
  "pdfUrl" TEXT,
  "emailSent" BOOLEAN DEFAULT FALSE,
  "emailSentAt" TIMESTAMP(3),
  CONSTRAINT "WholesaleDeliveryNote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "WholesaleCustomer"("id") ON DELETE CASCADE,
  CONSTRAINT "WholesaleDeliveryNote_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE,
  CONSTRAINT "WholesaleDeliveryNote_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "WholesaleOrder"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "WholesaleDeliveryNote_customerId_idx" ON "WholesaleDeliveryNote"("customerId");
CREATE INDEX IF NOT EXISTS "WholesaleDeliveryNote_companyId_idx" ON "WholesaleDeliveryNote"("companyId");
CREATE INDEX IF NOT EXISTS "WholesaleDeliveryNote_orderId_idx" ON "WholesaleDeliveryNote"("orderId");

-- Create WholesalePayment table
CREATE TABLE IF NOT EXISTS "WholesalePayment" (
  "id" SERIAL PRIMARY KEY,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "invoiceId" INTEGER NOT NULL,
  "customerId" INTEGER NOT NULL,
  "companyId" INTEGER NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "paymentMethod" TEXT NOT NULL,
  "reference" TEXT,
  "notes" TEXT,
  "createdBy" INTEGER NOT NULL,
  CONSTRAINT "WholesalePayment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "WholesaleInvoice"("id") ON DELETE CASCADE,
  CONSTRAINT "WholesalePayment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "WholesaleCustomer"("id") ON DELETE CASCADE,
  CONSTRAINT "WholesalePayment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE,
  CONSTRAINT "WholesalePayment_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id")
);

CREATE INDEX IF NOT EXISTS "WholesalePayment_invoiceId_idx" ON "WholesalePayment"("invoiceId");
CREATE INDEX IF NOT EXISTS "WholesalePayment_customerId_idx" ON "WholesalePayment"("customerId");
CREATE INDEX IF NOT EXISTS "WholesalePayment_companyId_idx" ON "WholesalePayment"("companyId");
CREATE INDEX IF NOT EXISTS "WholesalePayment_paymentDate_idx" ON "WholesalePayment"("paymentDate");

