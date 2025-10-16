const { PrismaClient } = require('./src/generated/prisma');

async function testCompanyCreation() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing company creation...');
    
    // Test company creation
    const testCompany = await prisma.company.create({
      data: {
        name: 'Test Company',
        slug: 'test-company',
        businessType: 'restaurant',
        country: 'United Kingdom',
        phone: '1234567890'
      }
    });
    
    console.log('Company created successfully:', testCompany.id);
    
    // Test company upsert
    const upsertedCompany = await prisma.company.upsert({
      where: { name: 'Test Company' },
      create: { 
        name: 'Test Company',
        slug: 'test-company-2',
        businessType: 'restaurant',
        country: 'United Kingdom',
        phone: '1234567890'
      },
      update: {},
    });
    
    console.log('Company upserted successfully:', upsertedCompany.id);
    
    // Clean up
    await prisma.company.deleteMany({ where: { name: { contains: 'Test Company' } } });
    console.log('Test companies deleted');
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCompanyCreation();
