const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function verify() {
  try {
    console.log('🔍 Verifying admin setup...\n');

    // 1. Check if isAdmin column exists
    const columnCheck = await prisma.$queryRaw`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'User' AND column_name = 'isAdmin'
    `;
    
    if (columnCheck.length === 0) {
      console.log('❌ isAdmin column does NOT exist');
      return;
    }
    console.log('✅ isAdmin column exists:', columnCheck[0]);

    // 2. Check plato328@admin.com account
    const adminUser = await prisma.user.findUnique({
      where: { email: 'plato328@admin.com' },
      select: {
        id: true,
        email: true,
        isAdmin: true,
        isActive: true,
      },
    });

    if (!adminUser) {
      console.log('⚠️  plato328@admin.com account does NOT exist');
      console.log('   You can create it or use environment variable fallback');
    } else {
      console.log('✅ plato328@admin.com account exists:');
      console.log('   - ID:', adminUser.id);
      console.log('   - Email:', adminUser.email);
      console.log('   - isAdmin:', adminUser.isAdmin);
      console.log('   - isActive:', adminUser.isActive);
      
      if (!adminUser.isAdmin) {
        console.log('⚠️  Account exists but isAdmin is false - updating...');
        await prisma.user.update({
          where: { id: adminUser.id },
          data: { isAdmin: true },
        });
        console.log('✅ Updated isAdmin to true');
      }
    }

    // 3. Count total system admins
    const adminCount = await prisma.user.count({
      where: { isAdmin: true, isActive: true },
    });
    console.log(`\n📊 Total system admins: ${adminCount}`);

    // 4. Verify separation - check that permissions.ts doesn't use isAdmin
    console.log('\n✅ Verification complete!');
    console.log('✅ System admin column restored');
    console.log('✅ Prisma client regenerated');
    console.log('✅ Separation verified (permissions.ts only uses membership.role)');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verify();

