import { prisma } from '@/lib/prisma';

async function auditLiveBuild() {
  console.log('🔍 Starting Live Build Audit...\n');

  try {
    // 1. Check for test recipes
    console.log('📋 Checking Recipes...');
    const allRecipes = await prisma.recipe.findMany({
      select: {
        id: true,
        name: true,
        companyId: true,
        createdAt: true,
        category: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const testRecipes = allRecipes.filter(r => 
      r.name.toLowerCase().includes('test') || 
      r.name.includes('Test Category')
    );

    console.log(`   Total recipes checked: ${allRecipes.length}`);
    console.log(`   ⚠️  Test recipes found: ${testRecipes.length}`);
    
    if (testRecipes.length > 0) {
      console.log('\n   Test recipes:');
      testRecipes.forEach(r => {
        console.log(`     - ID: ${r.id}, Name: "${r.name}", Company: ${r.companyId}, Created: ${r.createdAt.toISOString()}`);
      });
    }

    // 2. Check companies
    console.log('\n🏢 Checking Companies...');
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`   Total companies: ${companies.length}`);
    companies.forEach(c => {
      console.log(`     - ID: ${c.id}, Name: "${c.name}", Slug: ${c.slug}`);
    });

    // 3. Check recipes per company
    console.log('\n📊 Recipes per Company:');
    for (const company of companies) {
      const count = await prisma.recipe.count({
        where: { companyId: company.id },
      });
      const testCount = await prisma.recipe.count({
        where: {
          companyId: company.id,
          OR: [
            { name: { contains: 'test', mode: 'insensitive' } },
            { name: { contains: 'Test Category' } },
          ],
        },
      });
      console.log(`   ${company.name} (ID: ${company.id}):`);
      console.log(`     - Total recipes: ${count}`);
      console.log(`     - Test recipes: ${testCount}`);
    }

    // 4. Check for recipes without companyId
    console.log('\n⚠️  Checking for orphaned recipes (no companyId)...');
    const orphanedRecipes = await prisma.recipe.findMany({
      where: { companyId: null },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
      take: 20,
    });

    if (orphanedRecipes.length > 0) {
      console.log(`   Found ${orphanedRecipes.length} recipes without companyId:`);
      orphanedRecipes.forEach(r => {
        console.log(`     - ID: ${r.id}, Name: "${r.name}"`);
      });
    } else {
      console.log('   ✅ No orphaned recipes found');
    }

    // 5. Check categories
    console.log('\n📁 Checking Categories...');
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        companyId: true,
      },
      orderBy: { name: 'asc' },
    });

    const testCategories = categories.filter(c => 
      c.name.toLowerCase().includes('test')
    );

    console.log(`   Total categories: ${categories.length}`);
    if (testCategories.length > 0) {
      console.log(`   ⚠️  Test categories found: ${testCategories.length}`);
      testCategories.forEach(c => {
        console.log(`     - "${c.name}" (Company: ${c.companyId})`);
      });
    }

    // 6. Check ingredients
    console.log('\n🥚 Checking Ingredients...');
    const ingredients = await prisma.ingredient.findMany({
      select: {
        id: true,
        name: true,
        companyId: true,
      },
      orderBy: { name: 'asc' },
      take: 20,
    });

    const testIngredients = ingredients.filter(i => 
      i.name.toLowerCase().includes('test')
    );

    console.log(`   Sample ingredients checked: ${ingredients.length}`);
    if (testIngredients.length > 0) {
      console.log(`   ⚠️  Test ingredients found: ${testIngredients.length}`);
    }

    // 7. Summary
    console.log('\n📋 AUDIT SUMMARY:');
    console.log('═══════════════════════════════════════');
    console.log(`Total Companies: ${companies.length}`);
    console.log(`Total Recipes: ${await prisma.recipe.count()}`);
    console.log(`Test Recipes: ${testRecipes.length}`);
    console.log(`Orphaned Recipes: ${orphanedRecipes.length}`);
    console.log(`Test Categories: ${testCategories.length}`);
    console.log('═══════════════════════════════════════\n');

    // 8. Recommendations
    if (testRecipes.length > 0 || orphanedRecipes.length > 0) {
      console.log('🔧 RECOMMENDATIONS:');
      if (testRecipes.length > 0) {
        console.log('   1. Consider deleting or archiving test recipes');
        console.log('   2. Add filtering to exclude test recipes from production views');
      }
      if (orphanedRecipes.length > 0) {
        console.log('   3. Assign companyId to orphaned recipes or delete them');
      }
      console.log('   4. Add validation to prevent test data creation in production\n');
    } else {
      console.log('✅ No major issues detected!\n');
    }

  } catch (error) {
    console.error('❌ Audit failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

auditLiveBuild()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
