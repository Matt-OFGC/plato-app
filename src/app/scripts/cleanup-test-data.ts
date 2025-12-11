import { prisma } from '@/lib/prisma';

/**
 * Cleanup script to remove test data from production database
 * WARNING: This will permanently delete test companies and their associated data
 */

async function cleanupTestData() {
  console.log('🧹 Starting Test Data Cleanup...\n');
  console.log('⚠️  WARNING: This will delete test companies and all their data!\n');

  try {
    // 1. Find all test companies
    const testCompanies = await prisma.company.findMany({
      where: {
        OR: [
          { name: { contains: "Test Company", mode: "insensitive" } },
          { slug: { startsWith: "test-company" } },
        ]
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    console.log(`Found ${testCompanies.length} test companies to delete\n`);

    if (testCompanies.length === 0) {
      console.log('✅ No test companies found. Nothing to clean up.');
      return;
    }

    // Show what will be deleted
    console.log('Companies to be deleted:');
    testCompanies.slice(0, 10).forEach(c => {
      console.log(`  - ${c.name} (ID: ${c.id})`);
    });
    if (testCompanies.length > 10) {
      console.log(`  ... and ${testCompanies.length - 10} more`);
    }

    // 2. Count associated data
    let totalRecipes = 0;
    let totalIngredients = 0;
    let totalOrders = 0;

    for (const company of testCompanies) {
      const recipes = await prisma.recipe.count({ where: { companyId: company.id } });
      const ingredients = await prisma.ingredient.count({ where: { companyId: company.id } });
      const orders = await prisma.wholesaleOrder.count({ where: { companyId: company.id } });
      
      totalRecipes += recipes;
      totalIngredients += ingredients;
      totalOrders += orders;
    }

    console.log(`\n📊 Data to be deleted:`);
    console.log(`  - Recipes: ${totalRecipes}`);
    console.log(`  - Ingredients: ${totalIngredients}`);
    console.log(`  - Orders: ${totalOrders}`);

    // 3. Delete test companies (cascade will handle related data)
    console.log('\n🗑️  Deleting test companies...');
    
    const deleted = await prisma.company.deleteMany({
      where: {
        OR: [
          { name: { contains: "Test Company", mode: "insensitive" } },
          { slug: { startsWith: "test-company" } },
        ]
      },
    });

    console.log(`✅ Deleted ${deleted.count} test companies`);

    // 4. Clean up orphaned recipes (recipes without companyId that are test recipes)
    console.log('\n🧹 Cleaning up orphaned test recipes...');
    const orphanedTestRecipes = await prisma.recipe.deleteMany({
      where: {
        companyId: null,
        OR: [
          { name: { contains: "test", mode: "insensitive" } },
          { name: { contains: "Test Category" } },
        ]
      },
    });

    console.log(`✅ Deleted ${orphanedTestRecipes.count} orphaned test recipes`);

    // 5. Summary
    console.log('\n✅ Cleanup completed!');
    console.log('═══════════════════════════════════════');
    console.log(`Companies deleted: ${deleted.count}`);
    console.log(`Orphaned recipes deleted: ${orphanedTestRecipes.count}`);
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Safety check - require confirmation
const args = process.argv.slice(2);
if (args[0] !== '--confirm') {
  console.log('⚠️  SAFETY CHECK: This script will delete test data.');
  console.log('   To run it, use: npx tsx src/app/scripts/cleanup-test-data.ts --confirm\n');
  process.exit(1);
}

cleanupTestData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
