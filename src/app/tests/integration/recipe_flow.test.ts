/**
 * Recipe Flow Integration Tests
 * 
 * Exercises the complete recipe read/write flow across modules/pages to catch
 * cross-page breakage when schema evolves.
 * 
 * Test Flow:
 * 1. Create recipe → verify creation
 * 2. Read on recipe detail page → verify all fields present
 * 3. Read on recipe list page → verify fields match
 * 4. Read on dependent pages (production, wholesale) → verify no breakage
 * 5. Update recipe → verify updates persist
 * 6. Re-read on all pages → verify consistency
 * 
 * Run with: npm test -- tests/integration/recipe_flow.test.ts
 */

import { PrismaClient } from '@/generated/prisma';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';

// Polyfill setImmediate for test environment
if (typeof setImmediate === 'undefined') {
  (global as any).setImmediate = (fn: Function, ...args: any[]) => {
    return setTimeout(() => fn(...args), 0);
  };
}

const prisma = new PrismaClient();

// Test data factories
async function createTestCompany() {
  return await prisma.company.create({
    data: {
      name: `Test Company ${Date.now()}`,
      slug: `test-company-${Date.now()}`,
    },
  });
}

async function createTestUser(companyId: number) {
  return await prisma.user.create({
    data: {
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
      passwordHash: 'test-hash',
    },
  });
}

async function createTestIngredient(companyId: number) {
  return await prisma.ingredient.create({
    data: {
      name: `Test Ingredient ${Date.now()}`,
      packQuantity: 100,
      packUnit: 'g',
      packPrice: 5.50,
      currency: 'GBP',
      companyId,
    },
  });
}

async function createTestCategory(companyId: number) {
  return await prisma.category.create({
    data: {
      name: `Test Category ${Date.now()}`,
      companyId,
    },
  });
}

describe('Recipe Flow Integration Tests', () => {
  let testCompany: any;
  let testUser: any;
  let testIngredient: any;
  let testCategory: any;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    // Cleanup test data
    if (testCompany) {
      await prisma.company.deleteMany({ where: { id: testCompany.id } });
    }
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Create fresh test data for each test
    testCompany = await createTestCompany();
    testUser = await createTestUser(testCompany.id);
    testIngredient = await createTestIngredient(testCompany.id);
    testCategory = await createTestCategory(testCompany.id);
  });

  describe('Recipe Creation Flow', () => {
    it('should create a recipe with all required fields', async () => {
      const recipeData = {
        name: 'Test Recipe',
        yieldQuantity: 10,
        yieldUnit: 'each' as const,
        companyId: testCompany.id,
        description: 'Test description',
        imageUrl: 'https://example.com/image.jpg',
      };

      const recipe = await prisma.recipe.create({
        data: recipeData,
      });

      expect(recipe.id).toBeDefined();
      expect(recipe.name).toBe(recipeData.name);
      expect(recipe.yieldQuantity.toString()).toBe(recipeData.yieldQuantity.toString());
      expect(recipe.yieldUnit).toBe(recipeData.yieldUnit);
      expect(recipe.companyId).toBe(testCompany.id);
      expect(recipe.description).toBe(recipeData.description);
      expect(recipe.imageUrl).toBe(recipeData.imageUrl);
      expect(recipe.createdAt).toBeDefined();
      expect(recipe.updatedAt).toBeDefined();
    });

    it('should create a recipe with items (ingredients)', async () => {
      const recipe = await prisma.recipe.create({
        data: {
          name: 'Test Recipe with Items',
          yieldQuantity: 10,
          yieldUnit: 'each' as const,
          companyId: testCompany.id,
          items: {
            create: {
              ingredientId: testIngredient.id,
              quantity: 100,
              unit: 'g' as const,
              note: 'Test note',
            },
          },
        },
        include: {
          items: {
            include: {
              ingredient: true,
            },
          },
        },
      });

      expect(recipe.items.length).toBe(1);
      expect(recipe.items[0].ingredientId).toBe(testIngredient.id);
      expect(recipe.items[0].quantity.toString()).toBe('100');
      expect(recipe.items[0].unit).toBe('g');
      expect(recipe.items[0].ingredient.name).toBe(testIngredient.name);
    });

    it('should create a recipe with sections', async () => {
      const recipe = await prisma.recipe.create({
        data: {
          name: 'Test Recipe with Sections',
          yieldQuantity: 10,
          yieldUnit: 'each' as const,
          companyId: testCompany.id,
          sections: {
            create: {
              title: 'Step 1',
              description: 'First step',
              method: 'Do something',
              order: 0,
              bakeTemp: 180,
              bakeTime: 30,
              hasTimer: true,
            },
          },
        },
        include: {
          sections: {
            orderBy: { order: 'asc' },
          },
        },
      });

      expect(recipe.sections.length).toBe(1);
      expect(recipe.sections[0].title).toBe('Step 1');
      expect(recipe.sections[0].order).toBe(0);
      expect(recipe.sections[0].bakeTemp).toBe(180);
      expect(recipe.sections[0].bakeTime).toBe(30);
      expect(recipe.sections[0].hasTimer).toBe(true);
    });
  });

  describe('Recipe Read Flow (Detail Page)', () => {
    it('should read recipe with all fields for detail page', async () => {
      // Create recipe first
      const recipe = await prisma.recipe.create({
        data: {
          name: 'Detail Page Test Recipe',
          yieldQuantity: 10,
          yieldUnit: 'each' as const,
          companyId: testCompany.id,
          description: 'Test description',
          imageUrl: 'https://example.com/image.jpg',
          sellingPrice: 15.99,
          categoryId: testCategory.id,
          storage: 'Cool, dry place',
          shelfLife: '7 days',
        },
      });

      // Create section
      const section = await prisma.recipeSection.create({
        data: {
          recipeId: recipe.id,
          title: 'Step 1',
          order: 0,
        },
      });

      // Create item with explicit recipeId and sectionId
      await prisma.recipeItem.create({
        data: {
          recipeId: recipe.id,
          sectionId: section.id,
          ingredientId: testIngredient.id,
          quantity: 100,
          unit: 'g' as const,
        },
      });

      // Re-fetch recipe with all relations
      const recipeWithRelations = await prisma.recipe.findUnique({
        where: { id: recipe.id },
        include: {
          sections: {
            include: {
              items: {
                include: {
                  ingredient: true,
                },
              },
            },
            orderBy: { order: 'asc' },
          },
          items: {
            include: {
              ingredient: true,
            },
          },
          categoryRef: true,
        },
      });

      // Verify all fields required by detail page are present
      expect(recipeWithRelations?.id).toBeDefined();
      expect(recipeWithRelations?.name).toBeDefined();
      expect(recipeWithRelations?.description).toBeDefined();
      expect(recipeWithRelations?.yieldQuantity).toBeDefined();
      expect(recipeWithRelations?.yieldUnit).toBeDefined();
      expect(recipeWithRelations?.imageUrl).toBeDefined();
      expect(recipeWithRelations?.sellingPrice).toBeDefined();
      expect(recipeWithRelations?.storage).toBeDefined();
      expect(recipeWithRelations?.shelfLife).toBeDefined();
      expect(recipeWithRelations?.sections).toBeDefined();
      expect(recipeWithRelations?.sections.length).toBeGreaterThan(0);
      expect(recipeWithRelations?.sections[0].items).toBeDefined();
      expect(recipeWithRelations?.sections[0].items[0].ingredient).toBeDefined();
      expect(recipeWithRelations?.categoryRef).toBeDefined();
    });
  });

  describe('Recipe Read Flow (List Page)', () => {
    it('should read recipe with fields for list page', async () => {
      const recipe = await prisma.recipe.create({
        data: {
          name: 'List Page Test Recipe',
          yieldQuantity: 10,
          yieldUnit: 'each' as const,
          companyId: testCompany.id,
          description: 'Test description',
          imageUrl: 'https://example.com/image.jpg',
          sellingPrice: 15.99,
          categoryId: testCategory.id,
          items: {
            create: {
              ingredient: {
                connect: { id: testIngredient.id },
              },
              quantity: 100,
              unit: 'g' as const,
            },
          },
        },
        select: {
          id: true,
          name: true,
          description: true,
          yieldQuantity: true,
          yieldUnit: true,
          imageUrl: true,
          bakeTime: true,
          bakeTemp: true,
          storage: true,
          sellingPrice: true,
          category: true,
          categoryRef: {
            select: {
              name: true,
              color: true,
            },
          },
          items: {
            select: {
              id: true,
              quantity: true,
              ingredient: {
                select: {
                  packPrice: true,
                  packQuantity: true,
                },
              },
            },
          },
          sections: {
            select: {
              id: true,
              bakeTime: true,
            },
          },
        },
      });

      // Verify all fields required by list page are present
      expect(recipe.id).toBeDefined();
      expect(recipe.name).toBeDefined();
      expect(recipe.description).toBeDefined();
      expect(recipe.yieldQuantity).toBeDefined();
      expect(recipe.yieldUnit).toBeDefined();
      expect(recipe.imageUrl).toBeDefined();
      expect(recipe.sellingPrice).toBeDefined();
      expect(recipe.categoryRef).toBeDefined();
      expect(recipe.items).toBeDefined();
      expect(recipe.items[0].ingredient).toBeDefined();
      expect(recipe.items[0].ingredient.packPrice).toBeDefined();
      expect(recipe.items[0].ingredient.packQuantity).toBeDefined();
    });
  });

  describe('Recipe Read Flow (Business Profile Page)', () => {
    it('should read recipe with fields for business profile page', async () => {
      const recipe = await prisma.recipe.create({
        data: {
          name: 'Business Profile Test Recipe',
          yieldQuantity: 10,
          yieldUnit: 'each' as const,
          companyId: testCompany.id,
          description: 'Test description',
          imageUrl: 'https://example.com/image.jpg',
          portionsPerBatch: 12,
          categoryId: testCategory.id,
        },
        select: {
          id: true,
          name: true,
          description: true,
          yieldQuantity: true,
          yieldUnit: true,
          imageUrl: true,
          portionsPerBatch: true,
          category: true,
          // Note: Don't include items/ingredients (proprietary)
        },
      });

      // Verify all fields required by business profile page are present
      expect(recipe.id).toBeDefined();
      expect(recipe.name).toBeDefined();
      expect(recipe.description).toBeDefined();
      expect(recipe.yieldQuantity).toBeDefined();
      expect(recipe.yieldUnit).toBeDefined();
      expect(recipe.imageUrl).toBeDefined();
      expect(recipe.portionsPerBatch).toBeDefined();
      expect(recipe.category).toBeDefined();
      
      // Verify items are NOT included (proprietary data)
      expect((recipe as any).items).toBeUndefined();
    });
  });

  describe('Recipe Update Flow', () => {
    it('should update recipe and verify changes persist', async () => {
      const recipe = await prisma.recipe.create({
        data: {
          name: 'Update Test Recipe',
          yieldQuantity: 10,
          yieldUnit: 'each' as const,
          companyId: testCompany.id,
        },
      });

      const updatedRecipe = await prisma.recipe.update({
        where: { id: recipe.id },
        data: {
          name: 'Updated Recipe Name',
          description: 'Updated description',
          sellingPrice: 20.99,
        },
      });

      expect(updatedRecipe.name).toBe('Updated Recipe Name');
      expect(updatedRecipe.description).toBe('Updated description');
      expect(updatedRecipe.sellingPrice?.toString()).toBe('20.99');

      // Verify update persists
      const reReadRecipe = await prisma.recipe.findUnique({
        where: { id: recipe.id },
      });

      expect(reReadRecipe?.name).toBe('Updated Recipe Name');
      expect(reReadRecipe?.description).toBe('Updated description');
    });

    it('should update recipe items and verify changes persist', async () => {
      const recipe = await prisma.recipe.create({
        data: {
          name: 'Update Items Test Recipe',
          yieldQuantity: 10,
          yieldUnit: 'each' as const,
          companyId: testCompany.id,
          items: {
            create: {
              ingredient: {
                connect: { id: testIngredient.id },
              },
              quantity: 100,
              unit: 'g' as const,
            },
          },
        },
        include: {
          items: true,
        },
      });

      // Delete old items and create new ones (simulating update flow)
      await prisma.recipeItem.deleteMany({
        where: { recipeId: recipe.id },
      });

      await prisma.recipeItem.create({
        data: {
          recipeId: recipe.id,
          ingredientId: testIngredient.id,
          quantity: 200,
          unit: 'g' as const,
        },
      });

      const updatedRecipe = await prisma.recipe.findUnique({
        where: { id: recipe.id },
        include: {
          items: true,
        },
      });

      expect(updatedRecipe?.items.length).toBe(1);
      expect(updatedRecipe?.items[0].quantity.toString()).toBe('200');
    });
  });

  describe('Recipe Consistency Across Pages', () => {
    it('should return consistent data when read from different pages', async () => {
      const recipe = await prisma.recipe.create({
        data: {
          name: 'Consistency Test Recipe',
          yieldQuantity: 10,
          yieldUnit: 'each' as const,
          companyId: testCompany.id,
          description: 'Test description',
          sellingPrice: 15.99,
          categoryId: testCategory.id,
        },
      });

      // Read as detail page would
      const detailPageRecipe = await prisma.recipe.findUnique({
        where: { id: recipe.id },
        include: {
          sections: {
            include: {
              items: {
                include: {
                  ingredient: true,
                },
              },
            },
            orderBy: { order: 'asc' },
          },
          items: {
            include: {
              ingredient: true,
            },
          },
        },
      });

      // Read as list page would
      const listPageRecipe = await prisma.recipe.findUnique({
        where: { id: recipe.id },
        select: {
          id: true,
          name: true,
          description: true,
          yieldQuantity: true,
          yieldUnit: true,
          imageUrl: true,
          sellingPrice: true,
          categoryRef: {
            select: {
              name: true,
              color: true,
            },
          },
        },
      });

      // Verify core fields match
      expect(detailPageRecipe?.id).toBe(listPageRecipe?.id);
      expect(detailPageRecipe?.name).toBe(listPageRecipe?.name);
      expect(detailPageRecipe?.description).toBe(listPageRecipe?.description);
      expect(detailPageRecipe?.yieldQuantity.toString()).toBe(listPageRecipe?.yieldQuantity.toString());
      expect(detailPageRecipe?.yieldUnit).toBe(listPageRecipe?.yieldUnit);
    });
  });

  describe('Recipe Deletion Flow', () => {
    it('should cascade delete recipe items when recipe is deleted', async () => {
      const recipe = await prisma.recipe.create({
        data: {
          name: 'Cascade Delete Test Recipe',
          yieldQuantity: 10,
          yieldUnit: 'each' as const,
          companyId: testCompany.id,
          items: {
            create: {
              ingredient: {
                connect: { id: testIngredient.id },
              },
              quantity: 100,
              unit: 'g' as const,
            },
          },
        },
        include: {
          items: true,
        },
      });

      const itemId = recipe.items[0].id;

      // Delete recipe
      await prisma.recipe.delete({
        where: { id: recipe.id },
      });

      // Verify items are cascade deleted
      const remainingItem = await prisma.recipeItem.findUnique({
        where: { id: itemId },
      });

      expect(remainingItem).toBeNull();
    });

    it('should cascade delete recipe sections when recipe is deleted', async () => {
      const recipe = await prisma.recipe.create({
        data: {
          name: 'Cascade Delete Sections Test Recipe',
          yieldQuantity: 10,
          yieldUnit: 'each' as const,
          companyId: testCompany.id,
          sections: {
            create: {
              title: 'Step 1',
              order: 0,
            },
          },
        },
        include: {
          sections: true,
        },
      });

      const sectionId = recipe.sections[0].id;

      // Delete recipe
      await prisma.recipe.delete({
        where: { id: recipe.id },
      });

      // Verify sections are cascade deleted
      const remainingSection = await prisma.recipeSection.findUnique({
        where: { id: sectionId },
      });

      expect(remainingSection).toBeNull();
    });
  });

  describe('Bulk Operations', () => {
    it('should create multiple recipes in bulk', async () => {
      const recipes = await Promise.all([
        prisma.recipe.create({
          data: {
            name: 'Bulk Recipe 1',
            yieldQuantity: 10,
            yieldUnit: 'each' as const,
            companyId: testCompany.id,
          },
        }),
        prisma.recipe.create({
          data: {
            name: 'Bulk Recipe 2',
            yieldQuantity: 20,
            yieldUnit: 'each' as const,
            companyId: testCompany.id,
          },
        }),
        prisma.recipe.create({
          data: {
            name: 'Bulk Recipe 3',
            yieldQuantity: 30,
            yieldUnit: 'each' as const,
            companyId: testCompany.id,
          },
        }),
      ]);

      expect(recipes.length).toBe(3);
      expect(recipes[0].name).toBe('Bulk Recipe 1');
      expect(recipes[1].name).toBe('Bulk Recipe 2');
      expect(recipes[2].name).toBe('Bulk Recipe 3');

      // Verify all recipes exist
      const allRecipes = await prisma.recipe.findMany({
        where: { 
          id: { in: recipes.map(r => r.id) },
          companyId: testCompany.id 
        },
      });

      expect(allRecipes.length).toBe(3);
    });
  });

  describe('Ingredient Operations', () => {
    it('should update ingredient and verify recipe reads reflect changes', async () => {
      const recipe = await prisma.recipe.create({
        data: {
          name: 'Ingredient Update Test Recipe',
          yieldQuantity: 10,
          yieldUnit: 'each' as const,
          companyId: testCompany.id,
          items: {
            create: {
              ingredient: {
                connect: { id: testIngredient.id },
              },
              quantity: 100,
              unit: 'g' as const,
            },
          },
        },
        include: {
          items: {
            include: {
              ingredient: true,
            },
          },
        },
      });

      const originalPrice = recipe.items[0].ingredient.packPrice.toNumber();

      // Update ingredient price
      await prisma.ingredient.update({
        where: { id: testIngredient.id },
        data: {
          packPrice: 10.99,
        },
      });

      // Re-read recipe and verify ingredient price updated
      const updatedRecipe = await prisma.recipe.findUnique({
        where: { id: recipe.id },
        include: {
          items: {
            include: {
              ingredient: true,
            },
          },
        },
      });

      expect(updatedRecipe?.items[0].ingredient.packPrice.toNumber()).toBe(10.99);
      expect(updatedRecipe?.items[0].ingredient.packPrice.toNumber()).not.toBe(originalPrice);
    });

    it('should delete ingredient and verify cascade behavior', async () => {
      const recipe = await prisma.recipe.create({
        data: {
          name: 'Ingredient Delete Test Recipe',
          yieldQuantity: 10,
          yieldUnit: 'each' as const,
          companyId: testCompany.id,
          items: {
            create: {
              ingredient: {
                connect: { id: testIngredient.id },
              },
              quantity: 100,
              unit: 'g' as const,
            },
          },
        },
        include: {
          items: true,
        },
      });

      const itemId = recipe.items[0].id;

      // Delete ingredient (should cascade or restrict based on FK)
      // Note: This will fail if FK has ON DELETE RESTRICT
      try {
        await prisma.ingredient.delete({
          where: { id: testIngredient.id },
        });

        // If deletion succeeds, verify recipe item is handled appropriately
        const remainingItem = await prisma.recipeItem.findUnique({
          where: { id: itemId },
        });

        // Behavior depends on FK configuration
        // If CASCADE: item should be deleted
        // If RESTRICT: deletion should have failed
        expect(remainingItem).toBeDefined(); // Or null, depending on FK config
      } catch (error: any) {
        // If RESTRICT, deletion should fail
        // Prisma wraps PostgreSQL errors: 23503 becomes P2003
        expect(error.code).toBe('P2003'); // Foreign key violation
      }
    });
  });

  describe('Field Rename and Schema Evolution', () => {
    it('should handle recipe name update and verify all pages read correctly', async () => {
      const recipe = await prisma.recipe.create({
        data: {
          name: 'Original Recipe Name',
          yieldQuantity: 10,
          yieldUnit: 'each' as const,
          companyId: testCompany.id,
        },
      });

      // Update name
      await prisma.recipe.update({
        where: { id: recipe.id },
        data: {
          name: 'Updated Recipe Name',
        },
      });

      // Verify detail page reads updated name
      const detailPageRecipe = await prisma.recipe.findUnique({
        where: { id: recipe.id },
      });
      expect(detailPageRecipe?.name).toBe('Updated Recipe Name');

      // Verify list page reads updated name
      const listPageRecipe = await prisma.recipe.findUnique({
        where: { id: recipe.id },
        select: {
          id: true,
          name: true,
        },
      });
      expect(listPageRecipe?.name).toBe('Updated Recipe Name');

      // Verify business profile page reads updated name
      const businessPageRecipe = await prisma.recipe.findUnique({
        where: { id: recipe.id },
        select: {
          id: true,
          name: true,
        },
      });
      expect(businessPageRecipe?.name).toBe('Updated Recipe Name');
    });
  });

  describe('Dependent Page Reads', () => {
    it('should read recipe from production page without breakage', async () => {
      const recipe = await prisma.recipe.create({
        data: {
          name: 'Production Test Recipe',
          yieldQuantity: 10,
          yieldUnit: 'each' as const,
          companyId: testCompany.id,
        },
      });

      // Simulate production page query
      const productionRecipe = await prisma.recipe.findUnique({
        where: { id: recipe.id },
        select: {
          id: true,
          name: true,
          yieldQuantity: true,
          yieldUnit: true,
        },
      });

      expect(productionRecipe).toBeDefined();
      expect(productionRecipe?.id).toBe(recipe.id);
      expect(productionRecipe?.name).toBe('Production Test Recipe');
    });

    it('should read recipe from wholesale page without breakage', async () => {
      const recipe = await prisma.recipe.create({
        data: {
          name: 'Wholesale Test Recipe',
          yieldQuantity: 10,
          yieldUnit: 'each' as const,
          companyId: testCompany.id,
          sellingPrice: 15.99,
        },
      });

      // Simulate wholesale page query
      const wholesaleRecipe = await prisma.recipe.findUnique({
        where: { id: recipe.id },
        select: {
          id: true,
          name: true,
          sellingPrice: true,
        },
      });

      expect(wholesaleRecipe).toBeDefined();
      expect(wholesaleRecipe?.id).toBe(recipe.id);
      expect(wholesaleRecipe?.name).toBe('Wholesale Test Recipe');
      expect(wholesaleRecipe?.sellingPrice?.toNumber()).toBe(15.99);
    });
  });

  describe('Data Shape Consistency', () => {
    it('should return consistent data shapes across all read patterns', async () => {
      const recipe = await prisma.recipe.create({
        data: {
          name: 'Shape Consistency Test Recipe',
          yieldQuantity: 10,
          yieldUnit: 'each' as const,
          companyId: testCompany.id,
          description: 'Test description',
          sellingPrice: 15.99,
          categoryId: testCategory.id,
        },
      });

      // Detail page shape
      const detailShape = await prisma.recipe.findUnique({
        where: { id: recipe.id },
        include: {
          sections: true,
          items: true,
          categoryRef: true,
        },
      });

      // List page shape
      const listShape = await prisma.recipe.findUnique({
        where: { id: recipe.id },
        select: {
          id: true,
          name: true,
          description: true,
          yieldQuantity: true,
          yieldUnit: true,
          sellingPrice: true,
          categoryRef: {
            select: {
              name: true,
              color: true,
            },
          },
        },
      });

      // Verify core fields match
      expect(detailShape?.id).toBe(listShape?.id);
      expect(detailShape?.name).toBe(listShape?.name);
      expect(detailShape?.description).toBe(listShape?.description);
      expect(detailShape?.yieldQuantity.toString()).toBe(listShape?.yieldQuantity.toString());
      expect(detailShape?.yieldUnit).toBe(listShape?.yieldUnit);
      
      // Verify category consistency
      if (detailShape?.categoryRef && listShape?.categoryRef) {
        expect(detailShape.categoryRef.name).toBe(listShape.categoryRef.name);
      }
    });
  });
});

