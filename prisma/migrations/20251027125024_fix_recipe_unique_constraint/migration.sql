-- Drop the existing unique constraint on Recipe.name
-- This allows recipes with the same name in different companies
DROP INDEX IF EXISTS "Recipe_name_key";

-- Add a unique constraint on (name, companyId) to ensure recipe names are unique per company
-- Note: The @@unique([name, companyId]) in schema.prisma will create this index
CREATE UNIQUE INDEX "Recipe_name_companyId_key" ON "Recipe"("name", "companyId");
