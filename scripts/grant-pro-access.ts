// Script to grant Pro access to specific user
import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function grantProAccess() {
  const email = 'penney3281@gmail.com';
  
  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`User with email ${email} not found!`);
      process.exit(1);
    }

    console.log(`Found user: ${user.email} (ID: ${user.id})`);

    // Create or update subscription to Pro (lifetime free)
    const subscription = await prisma.subscription.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        status: 'active',
        tier: 'pro',
        price: 0, // Free!
        currency: 'GBP',
        interval: 'month',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date('2099-12-31'), // Essentially lifetime
        maxIngredients: null, // unlimited
        maxRecipes: null, // unlimited
      },
      update: {
        status: 'active',
        tier: 'pro',
        price: 0, // Free!
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date('2099-12-31'), // Essentially lifetime
        maxIngredients: null,
        maxRecipes: null,
      },
    });

    // Update user subscription fields
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionTier: 'pro',
        subscriptionStatus: 'active',
        subscriptionEndsAt: new Date('2099-12-31'),
      },
    });

    console.log('✅ Successfully granted Pro access!');
    console.log(`User: ${email}`);
    console.log(`Tier: ${subscription.tier}`);
    console.log(`Status: ${subscription.status}`);
    console.log(`Price: £${subscription.price}/month (FREE!)`);
    console.log(`Expires: Never (lifetime access)`);
    
  } catch (error) {
    console.error('Error granting Pro access:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

grantProAccess();

