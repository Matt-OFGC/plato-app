/*
  Warnings:

  - You are about to drop the column `wastePercent` on the `Recipe` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Ingredient" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "supplier" TEXT,
    "packQuantity" DECIMAL NOT NULL,
    "packUnit" TEXT NOT NULL,
    "packPrice" DECIMAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "densityGPerMl" DECIMAL,
    "notes" TEXT
);
INSERT INTO "new_Ingredient" ("createdAt", "currency", "densityGPerMl", "id", "name", "notes", "packPrice", "packQuantity", "packUnit", "supplier", "updatedAt") SELECT "createdAt", "currency", "densityGPerMl", "id", "name", "notes", "packPrice", "packQuantity", "packUnit", "supplier", "updatedAt" FROM "Ingredient";
DROP TABLE "Ingredient";
ALTER TABLE "new_Ingredient" RENAME TO "Ingredient";
CREATE UNIQUE INDEX "Ingredient_name_key" ON "Ingredient"("name");
CREATE TABLE "new_Recipe" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "yieldQuantity" DECIMAL NOT NULL,
    "yieldUnit" TEXT NOT NULL,
    "imageUrl" TEXT
);
INSERT INTO "new_Recipe" ("createdAt", "id", "name", "updatedAt", "yieldQuantity", "yieldUnit") SELECT "createdAt", "id", "name", "updatedAt", "yieldQuantity", "yieldUnit" FROM "Recipe";
DROP TABLE "Recipe";
ALTER TABLE "new_Recipe" RENAME TO "Recipe";
CREATE UNIQUE INDEX "Recipe_name_key" ON "Recipe"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
