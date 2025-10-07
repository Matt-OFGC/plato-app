-- CreateEnum
CREATE TYPE "BaseUnit" AS ENUM ('g', 'ml', 'each');

-- CreateEnum
CREATE TYPE "Unit" AS ENUM ('g', 'kg', 'mg', 'lb', 'oz', 'ml', 'l', 'pint', 'quart', 'gallon', 'tsp', 'tbsp', 'cup', 'floz', 'each');

-- CreateTable
CREATE TABLE "Ingredient" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "supplier" TEXT,
    "packQuantity" DECIMAL(65,30) NOT NULL,
    "packUnit" "BaseUnit" NOT NULL,
    "packPrice" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "densityGPerMl" DECIMAL(65,30),
    "notes" TEXT,
    "companyId" INTEGER,

    CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "yieldQuantity" DECIMAL(65,30) NOT NULL,
    "yieldUnit" "BaseUnit" NOT NULL,
    "imageUrl" TEXT,
    "companyId" INTEGER,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeItem" (
    "id" SERIAL NOT NULL,
    "recipeId" INTEGER NOT NULL,
    "ingredientId" INTEGER NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "unit" "Unit" NOT NULL,
    "note" TEXT,

    CONSTRAINT "RecipeItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ingredient_name_key" ON "Ingredient"("name");

-- CreateIndex
CREATE INDEX "Ingredient_companyId_idx" ON "Ingredient"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_name_key" ON "Recipe"("name");

-- CreateIndex
CREATE INDEX "Recipe_companyId_idx" ON "Recipe"("companyId");

-- CreateIndex
CREATE INDEX "RecipeItem_recipeId_idx" ON "RecipeItem"("recipeId");

-- CreateIndex
CREATE INDEX "RecipeItem_ingredientId_idx" ON "RecipeItem"("ingredientId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Company_name_key" ON "Company"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_companyId_key" ON "Membership"("userId", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");

-- AddForeignKey
ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeItem" ADD CONSTRAINT "RecipeItem_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeItem" ADD CONSTRAINT "RecipeItem_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
