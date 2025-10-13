const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function makeAdmin() {
  try {
    // Make Matt Penney an admin
    const updatedUser = await prisma.user.update({
      where: { email: 'penney3281@gmail.com' },
      data: { isAdmin: true }
    });

    console.log('✅ Matt Penney is now an admin!');
    console.log('Email:', updatedUser.email);
    console.log('Admin status:', updatedUser.isAdmin);
  } catch (error) {
    console.error('Error making user admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

makeAdmin();