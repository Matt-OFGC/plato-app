// Script to set user as OWNER of their company
import { PrismaClient, MemberRole } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function setOwnerRole() {
  const email = 'penney3281@gmail.com';
  
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { memberships: true },
    });

    if (!user) {
      console.error(`User with email ${email} not found!`);
      process.exit(1);
    }

    console.log(`Found user: ${user.email} (ID: ${user.id})`);
    console.log(`Current memberships: ${user.memberships.length}`);

    // Update all memberships to OWNER role
    for (const membership of user.memberships) {
      await prisma.membership.update({
        where: { id: membership.id },
        data: { role: MemberRole.OWNER },
      });
      
      // Also set the company's ownerId
      await prisma.company.update({
        where: { id: membership.companyId },
        data: { ownerId: user.id },
      });
      
      console.log(`✅ Set as OWNER of company ID ${membership.companyId}`);
    }

    console.log('\n✅ Successfully set as OWNER of all companies!');
    
  } catch (error) {
    console.error('Error setting owner role:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setOwnerRole();

