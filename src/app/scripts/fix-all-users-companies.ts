import { prisma } from '@/lib/prisma';
import { generateUniqueSlug } from '@/lib/slug';

/**
 * Script to fix all users who don't have active company memberships
 * This creates a default company for users who are missing one
 * 
 * Usage: npx tsx src/app/scripts/fix-all-users-companies.ts
 */

async function fixAllUsersCompanies() {
  console.log('🔍 Finding users without active company memberships...\n');

  try {
    // Find all users
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    console.log(`Found ${allUsers.length} total users\n`);

    let fixed = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of allUsers) {
      try {
        // Check if user has any active memberships
        const activeMemberships = await prisma.membership.findMany({
          where: {
            userId: user.id,
            isActive: true,
          },
          include: {
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        if (activeMemberships.length > 0) {
          console.log(`✅ User ${user.email} (ID: ${user.id}) already has ${activeMemberships.length} active membership(s)`);
          skipped++;
          continue;
        }

        // Check if user has inactive memberships
        const inactiveMemberships = await prisma.membership.findMany({
          where: {
            userId: user.id,
            isActive: false,
          },
          include: {
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        if (inactiveMemberships.length > 0) {
          // Reactivate the first inactive membership
          const membership = inactiveMemberships[0];
          await prisma.membership.update({
            where: {
              userId_companyId: {
                userId: user.id,
                companyId: membership.companyId,
              },
            },
            data: {
              isActive: true,
            },
          });
          console.log(`✅ Reactivated membership for ${user.email} (ID: ${user.id}) - Company: ${membership.company.name}`);
          fixed++;
          continue;
        }

        // User has no memberships at all - create a company and membership
        const companyName = user.name 
          ? `${user.name}'s Company`
          : `Company for ${user.email.split('@')[0]}`;

        // Generate unique slug
        const baseSlug = companyName.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        
        let slug = baseSlug;
        let counter = 1;
        while (await prisma.company.findUnique({ where: { slug } })) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }

        // Create company
        const company = await prisma.company.create({
          data: {
            name: companyName,
            slug,
            businessType: 'Bakery',
            country: 'United Kingdom',
          },
        });

        // Create membership
        await prisma.membership.create({
          data: {
            userId: user.id,
            companyId: company.id,
            role: 'ADMIN',
            isActive: true,
          },
        });

        console.log(`✅ Created company and membership for ${user.email} (ID: ${user.id}) - Company: ${company.name} (ID: ${company.id})`);
        fixed++;

      } catch (error: any) {
        console.error(`❌ Error fixing user ${user.email} (ID: ${user.id}):`, error.message);
        errors++;
      }
    }

    console.log('\n═══════════════════════════════════════');
    console.log('📊 SUMMARY:');
    console.log(`   Total users: ${allUsers.length}`);
    console.log(`   ✅ Fixed: ${fixed}`);
    console.log(`   ⏭️  Skipped (already have company): ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Script failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixAllUsersCompanies()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
