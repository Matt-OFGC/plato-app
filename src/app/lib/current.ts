import { getUserFromSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";

/**
 * Get the current user and company from session
 */
export async function getCurrentUserAndCompany() {
  const user = await getUserFromSession();
  
  if (!user) {
    throw new Error("Not authenticated");
  }

  // Get user's company membership
  const membership = await prisma.membership.findFirst({
    where: {
      userId: user.id,
      isActive: true,
    },
    include: {
      company: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  const companyId = membership?.companyId || null;
  const company = membership?.company || null;

  return {
    user,
    companyId,
    company,
    membership,
  };
}
