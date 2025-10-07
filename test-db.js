// Test script to verify your PostgreSQL connection
// Run with: node test-db.js

const { PrismaClient } = require('./src/generated/prisma');

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    // Test the connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database query successful:', result);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure your DATABASE_URL is correct');
    console.log('2. Check that your database is running');
    console.log('3. Verify your connection string format');
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
