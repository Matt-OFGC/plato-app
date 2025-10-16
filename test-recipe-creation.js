const { PrismaClient } = require('./src/generated/prisma');

async function testRecipeCreation() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing recipe creation performance...');
    
    const startTime = Date.now();
    
    // Test creating a simple recipe
    const recipe = await prisma.recipe.create({
      data: {
        name: 'Test Recipe',
        yieldQuantity: 1,
        yieldUnit: 'each',
        portionsPerBatch: 1,
        companyId: 1, // Assuming company ID 1 exists
        items: {
          create: [
            {
              ingredientId: 1, // Assuming ingredient ID 1 exists
              quantity: 100,
              unit: 'g',
            }
          ]
        }
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`Recipe created in ${duration}ms`);
    console.log('Recipe ID:', recipe.id);
    
    // Clean up
    await prisma.recipeItem.deleteMany({ where: { recipeId: recipe.id } });
    await prisma.recipe.delete({ where: { id: recipe.id } });
    console.log('Test recipe cleaned up');
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.message.includes('companyId')) {
      console.log('Note: Company ID 1 might not exist. This is expected in a fresh database.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testRecipeCreation();
