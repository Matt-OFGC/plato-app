// Test database connectivity
const { PrismaClient } = require('./src/generated/prisma');

async function testDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing database connectivity...');
    
    // Test basic query
    const userCount = await prisma.user.count();
    console.log('User count:', userCount);
    
    // Test ingredient query
    const ingredientCount = await prisma.ingredient.count();
    console.log('Ingredient count:', ingredientCount);
    
    // Test recipe query
    const recipeCount = await prisma.recipe.count();
    console.log('Recipe count:', recipeCount);
    
    // Test supplier query
    const supplierCount = await prisma.supplier.count();
    console.log('Supplier count:', supplierCount);
    
    // Test category query
    const categoryCount = await prisma.category.count();
    console.log('Category count:', categoryCount);
    
    console.log('Database connectivity test completed successfully!');
    
  } catch (error) {
    console.error('Database test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();