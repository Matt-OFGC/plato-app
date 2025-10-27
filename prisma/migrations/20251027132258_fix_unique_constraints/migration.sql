-- Fix unique constraints to allow proper multi-tenant behavior

-- Remove unique constraint from Recipe.name (allows different companies to have same recipe names)
DROP INDEX IF EXISTS "Recipe_name_key";

-- Add composite unique constraint for Recipe (name + companyId)
CREATE UNIQUE INDEX "Recipe_name_companyId_key" ON "Recipe"("name", "companyId");

-- Remove unique constraint from Company.name (allows duplicate company names, slug is the unique identifier)
DROP INDEX IF EXISTS "Company_name_key";
