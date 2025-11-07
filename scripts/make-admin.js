const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function makeAdmin(email) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      console.error(`❌ User with email "${email}" not found`);
      process.exit(1);
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { 
        isAdmin: true,
        isActive: true,
      }
    });

    console.log(`✅ User "${email}" is now an admin!`);
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   Admin status: ${updatedUser.isAdmin}`);
    console.log(`   Active status: ${updatedUser.isActive}`);
    console.log(`\n   You can now log in to /system-admin/auth with:`);
    console.log(`   Username: ${email}`);
    console.log(`   Password: (your existing password)`);
  } catch (error) {
    console.error('❌ Error making user admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line arguments or use default
const email = process.argv[2] || 'penney3281@gmail.com';

if (!email) {
  console.error('Usage: node scripts/make-admin.js <email>');
  console.error('Example: node scripts/make-admin.js admin@example.com');
  process.exit(1);
}

makeAdmin(email);