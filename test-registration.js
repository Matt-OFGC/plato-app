const { PrismaClient } = require('./src/generated/prisma');
const bcrypt = require('bcrypt');

async function testRegistration() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing database connection...');
    
    // Test basic database connection
    const userCount = await prisma.user.count();
    console.log('Database connected. User count:', userCount);
    
    // Test user creation with minimal data
    console.log('Testing user creation...');
    const passwordHash = await bcrypt.hash('TestPass123', 10);
    
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: passwordHash,
      }
    });
    
    console.log('User created successfully:', testUser.id);
    
    // Clean up
    await prisma.user.delete({ where: { id: testUser.id } });
    console.log('Test user deleted');
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRegistration();
