const { PrismaClient } = require('../src/generated/prisma');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '../../.env' });

const prisma = new PrismaClient();

async function setupAdmin() {
  try {
    const email = process.argv[2] || 'plato328@admin.com';
    const password = process.argv[3] || null;

    if (!password) {
      console.log('❌ Usage: node scripts/setup-admin-account.js <email> <password>');
      console.log('   Example: node scripts/setup-admin-account.js plato328@admin.com mypassword123');
      process.exit(1);
    }

    console.log('🔧 Setting up admin account...\n');

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        isAdmin: true,
        isActive: true,
        passwordHash: true,
      },
    });

    if (user) {
      console.log(`✅ User ${email} already exists`);
      console.log(`   - ID: ${user.id}`);
      console.log(`   - isAdmin: ${user.isAdmin}`);
      console.log(`   - isActive: ${user.isActive}`);
      
      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Update user: set isAdmin, isActive, and password
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          isAdmin: true,
          isActive: true,
          passwordHash: passwordHash,
        },
      });

      console.log(`\n✅ Updated admin account:`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - isAdmin: ${user.isAdmin}`);
      console.log(`   - Password: Updated`);
      console.log(`\n🎉 You can now log in with:`);
      console.log(`   Username: ${email}`);
      console.log(`   Password: ${password}`);
    } else {
      console.log(`📝 Creating new admin account: ${email}`);
      
      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Create user
      user = await prisma.user.create({
        data: {
          email,
          name: 'System Admin',
          passwordHash,
          isAdmin: true,
          isActive: true,
          subscriptionTier: 'free',
          subscriptionStatus: 'free',
          updatedAt: new Date(),
        },
      });

      console.log(`\n✅ Created admin account:`);
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - isAdmin: ${user.isAdmin}`);
      console.log(`\n🎉 You can now log in with:`);
      console.log(`   Username: ${email}`);
      console.log(`   Password: ${password}`);
    }

    // Verify
    const verifyUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        isAdmin: true,
        isActive: true,
      },
    });

    if (verifyUser && verifyUser.isAdmin && verifyUser.isActive) {
      console.log(`\n✅ Verification: Admin account is ready!`);
    } else {
      console.log(`\n⚠️  Warning: Account may not be properly configured`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupAdmin();

