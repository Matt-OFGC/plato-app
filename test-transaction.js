const { PrismaClient } = require('./src/generated/prisma');
const bcrypt = require('bcrypt');

async function testFullTransaction() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing full registration transaction...');
    
    const email = 'test@example.com';
    const password = 'TestPass123';
    const company = 'Test Company';
    const name = 'Test User';
    const businessType = 'restaurant';
    const country = 'United Kingdom';
    const phone = '1234567890';
    
    const passwordHash = await bcrypt.hash(password, 10);
    const slug = 'test-company';
    const currency = 'GBP';
    
    console.log('Starting transaction...');
    
    const [co, user] = await prisma.$transaction([
      prisma.company.upsert({
        where: { name: company },
        create: { 
          name: company,
          slug,
          businessType,
          country,
          phone
        },
        update: {},
      }),
      prisma.user.create({ 
        data: { 
          email, 
          name, 
          passwordHash, 
          preferences: { 
            create: { currency } 
          } 
        } 
      })
    ]);
    
    console.log('Transaction successful!');
    console.log('Company ID:', co.id);
    console.log('User ID:', user.id);
    
    // Create membership
    await prisma.membership.create({ 
      data: { 
        userId: user.id, 
        companyId: co.id, 
        role: "ADMIN" 
      } 
    });
    
    console.log('Membership created successfully');
    
    // Clean up
    await prisma.membership.deleteMany({ where: { userId: user.id } });
    await prisma.userPreference.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.company.delete({ where: { id: co.id } });
    console.log('Cleanup completed');
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFullTransaction();
