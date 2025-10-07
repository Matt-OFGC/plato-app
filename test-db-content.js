// Test script to check database content
const { PrismaClient } = require('./src/generated/prisma');

async function checkDatabase() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Checking database content...\n');

    // Check recipes
    const recipes = await prisma.recipe.findMany({
      include: {
        items: true,
        sections: true,
        subRecipes: true,
      }
    });
    console.log(`📋 Found ${recipes.length} recipes:`);
    recipes.forEach(recipe => {
      console.log(`  - ${recipe.name} (ID: ${recipe.id})`);
      console.log(`    Items: ${recipe.items.length}`);
      console.log(`    Sections: ${recipe.sections.length}`);
      console.log(`    Sub-recipes: ${recipe.subRecipes.length}`);
    });

    // Check ingredients
    const ingredients = await prisma.ingredient.findMany();
    console.log(`\n🧂 Found ${ingredients.length} ingredients:`);
    ingredients.forEach(ingredient => {
      console.log(`  - ${ingredient.name} (ID: ${ingredient.id})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
