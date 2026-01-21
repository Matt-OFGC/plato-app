const { PrismaClient } = require("../src/generated/prisma");
const bcrypt = require("bcrypt");
require("dotenv").config({ path: "../../.env" });

const prisma = new PrismaClient();

async function createUser() {
  try {
    const email = process.argv[2];
    const password = process.argv[3];
    const name = process.argv[4] || null;

    if (!email || !password) {
      console.log("❌ Usage: node scripts/create-user.js <email> <password> [name]");
      console.log("   Example: node scripts/create-user.js user@example.com mypassword \"User Name\"");
      process.exit(1);
    }

    console.log("🔧 Creating user account...\n");

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, isAdmin: true, isActive: true },
    });

    if (existing) {
      console.log(`✅ User ${email} already exists`);
      console.log(`   - ID: ${existing.id}`);
      console.log(`   - isAdmin: ${existing.isAdmin}`);
      console.log(`   - isActive: ${existing.isActive}`);
      console.log("   - Password: unchanged");
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        isAdmin: false,
        isActive: true,
        subscriptionTier: "free",
        subscriptionStatus: "free",
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        isAdmin: true,
        isActive: true,
      },
    });

    console.log("✅ Created user account:");
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - isAdmin: ${user.isAdmin}`);
  } catch (error) {
    console.error("❌ Error:", error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createUser();
