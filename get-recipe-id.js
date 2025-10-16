const { PrismaClient } = require('@prisma/client');

async function getRecipeId() {
  const prisma = new PrismaClient();
  
  try {
    const recipe = await prisma.recipe.findFirst({
      select: { id: true, name: true }
    });
    
    if (recipe) {
      console.log(`Recipe ID: ${recipe.id}`);
      console.log(`Recipe Name: ${recipe.name}`);
      console.log(`Test URL: http://localhost:3000/test-recipe-view/${recipe.id}`);
    } else {
      console.log('No recipes found in database');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

getRecipeId();
