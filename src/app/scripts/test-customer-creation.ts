import { prisma } from '@/lib/prisma';

async function testCustomerCreation() {
  console.log('🧪 Testing customer creation...\n');

  try {
    // Get a company ID to test with
    const company = await prisma.company.findFirst({
      select: { id: true, name: true },
    });

    if (!company) {
      console.error('❌ No company found in database');
      return;
    }

    console.log(`📋 Using company: ${company.name} (ID: ${company.id})\n`);

    // Test data matching what the form sends
    const testData = {
      name: "Test Customer " + Date.now(),
      contactName: null,
      email: null,
      phone: null,
      address: null,
      city: null,
      postcode: null,
      country: null,
      notes: null,
      isActive: true,
      companyId: company.id,
      openingHours: null,
      deliveryDays: [],
      preferredDeliveryTime: null,
      paymentTerms: null,
      creditLimit: null,
      taxId: null,
      accountManager: null,
      specialInstructions: null,
      orderFrequency: null,
    };

    console.log('📝 Attempting to create customer with data:');
    console.log(JSON.stringify(testData, null, 2));
    console.log('\n');

    const customer = await prisma.wholesaleCustomer.create({
      data: testData,
    });

    console.log('✅ Customer created successfully!');
    console.log(`   ID: ${customer.id}`);
    console.log(`   Name: ${customer.name}`);
    
    // Clean up - delete test customer
    await prisma.wholesaleCustomer.delete({
      where: { id: customer.id },
    });
    console.log('\n🧹 Test customer deleted');

  } catch (error: any) {
    console.error('❌ Customer creation failed!');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('Meta:', JSON.stringify(error.meta, null, 2));
    if (error.stack) {
      console.error('\nStack:', error.stack);
    }
  }
}

testCustomerCreation()
  .finally(async () => {
    await prisma.$disconnect();
  });
