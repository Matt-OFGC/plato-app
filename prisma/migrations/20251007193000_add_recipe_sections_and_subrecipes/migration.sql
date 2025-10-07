-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN     "description" TEXT,
ADD COLUMN     "method" TEXT;

-- AlterTable
ALTER TABLE "RecipeItem" ADD COLUMN     "sectionId" INTEGER;

-- CreateTable
CREATE TABLE "RecipeSection" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "recipeId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "method" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RecipeSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeSubRecipe" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "parentRecipeId" INTEGER NOT NULL,
    "subRecipeId" INTEGER NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "unit" "Unit" NOT NULL,
    "note" TEXT,

    CONSTRAINT "RecipeSubRecipe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecipeSection_recipeId_idx" ON "RecipeSection"("recipeId");

-- CreateIndex
CREATE INDEX "RecipeSection_recipeId_order_idx" ON "RecipeSection"("recipeId", "order");

-- CreateIndex
CREATE INDEX "RecipeSubRecipe_parentRecipeId_idx" ON "RecipeSubRecipe"("parentRecipeId");

-- CreateIndex
CREATE INDEX "RecipeSubRecipe_subRecipeId_idx" ON "RecipeSubRecipe"("subRecipeId");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeSubRecipe_parentRecipeId_subRecipeId_key" ON "RecipeSubRecipe"("parentRecipeId", "subRecipeId");

-- CreateIndex
CREATE INDEX "RecipeItem_sectionId_idx" ON "RecipeItem"("sectionId");

-- AddForeignKey
ALTER TABLE "RecipeItem" ADD CONSTRAINT "RecipeItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "RecipeSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeSection" ADD CONSTRAINT "RecipeSection_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeSubRecipe" ADD CONSTRAINT "RecipeSubRecipe_parentRecipeId_fkey" FOREIGN KEY ("parentRecipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeSubRecipe" ADD CONSTRAINT "RecipeSubRecipe_subRecipeId_fkey" FOREIGN KEY ("subRecipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
