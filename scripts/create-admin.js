const { PrismaClient } = require('../src/generated/prisma');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdminUser(email, password) {
  try {
    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (user) {
      // Update existing user to be admin
      const passwordHash = await bcrypt.hash(password, 10);
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          isAdmin: true,
          isActive: true,
          passwordHash: passwordHash,
        },
      });
      console.log(`✅ Updated existing user "${email}" to admin`);
    } else {
      // Create new admin user
      const passwordHash = await bcrypt.hash(password, 10);
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase().trim(),
          name: 'Admin User',
          passwordHash: passwordHash,
          isAdmin: true,
          isActive: true,
          emailVerified: true,
        },
      });
      console.log(`✅ Created new admin user "${email}"`);
    }

    console.log(`\n   Login credentials:`);
    console.log(`   Username: ${user.email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Admin: ${user.isAdmin ? '✅' : '❌'}`);
    console.log(`   Active: ${user.isActive ? '✅' : '❌'}`);
    console.log(`\n   You can now log in to /system-admin/auth`);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email and password from command line arguments
const email = process.argv[2] || 'Plato328@admin.com';
const password = process.argv[3] || 'Plato328!';

if (!email || !password) {
  console.error('Usage: node scripts/create-admin.js <email> <password>');
  console.error('Example: node scripts/create-admin.js Plato328@admin.com Plato328!');
  process.exit(1);
}

createAdminUser(email, password);

