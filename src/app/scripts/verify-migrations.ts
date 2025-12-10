import { prisma } from '@/lib/prisma';

async function verifyMigrations() {
  console.log('🔍 Verifying migrations...\n');

  const checks = [
    {
      name: 'WholesaleCustomer fields',
      check: async () => {
        // Try to query a field that should exist
        const result = await prisma.$queryRaw<Array<{ column_name: string }>>`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'WholesaleCustomer' 
          AND column_name IN ('openingHours', 'deliveryDays', 'creditLimit', 'outstandingBalance', 'totalOrders', 'totalValue', 'totalPaid')
        `;
        return result.length >= 7;
      }
    },
    {
      name: 'WholesaleInvoice table',
      check: async () => {
        const result = await prisma.$queryRaw<Array<{ table_name: string }>>`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_name = 'WholesaleInvoice'
        `;
        return result.length > 0;
      }
    },
    {
      name: 'WholesaleDeliveryNote table',
      check: async () => {
        const result = await prisma.$queryRaw<Array<{ table_name: string }>>`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_name = 'WholesaleDeliveryNote'
        `;
        return result.length > 0;
      }
    },
    {
      name: 'WholesalePayment table',
      check: async () => {
        const result = await prisma.$queryRaw<Array<{ table_name: string }>>`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_name = 'WholesalePayment'
        `;
        return result.length > 0;
      }
    },
    {
      name: 'Recipe wholesalePrice field',
      check: async () => {
        const result = await prisma.$queryRaw<Array<{ column_name: string }>>`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'Recipe' 
          AND column_name = 'wholesalePrice'
        `;
        return result.length > 0;
      }
    }
  ];

  let allPassed = true;

  for (const check of checks) {
    try {
      const passed = await check.check();
      if (passed) {
        console.log(`✅ ${check.name}: OK`);
      } else {
        console.log(`❌ ${check.name}: FAILED`);
        allPassed = false;
      }
    } catch (error: any) {
      console.log(`❌ ${check.name}: ERROR - ${error.message}`);
      allPassed = false;
    }
  }

  console.log('\n');
  if (allPassed) {
    console.log('✅ All migrations verified successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Start your dev server: npm run dev');
    console.log('   2. Navigate to /dashboard/wholesale');
    console.log('   3. Try creating a customer');
    console.log('   4. Try creating an order');
    console.log('   5. Try creating an invoice from an order');
  } else {
    console.log('❌ Some migrations failed verification');
    console.log('   Please check the migration logs above');
  }
}

verifyMigrations()
  .catch((error) => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
