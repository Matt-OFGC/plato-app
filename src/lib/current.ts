import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";

export async function getCurrentUserAndCompany() {
  const session = await getSession();
  if (!session) return { user: null, companyId: null, company: null, currency: "GBP" };
  
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: {
      memberships: {
        where: { isActive: true },
        orderBy: { createdAt: 'asc' }
      },
      preferences: true
    },
  });

  if (!user) return { user: null, companyId: null, company: null, currency: "GBP" };
  // Only use active memberships, prioritize first (oldest) active membership
  const membership = user.memberships.find(m => m.isActive) || user.memberships[0] || null;
  const companyId = membership?.companyId ?? null;
  const currency = user.preferences?.currency ?? "GBP";
  
  // Fetch company details if user has a company
  let company = null;
  if (companyId) {
    company = await prisma.company.findUnique({
      where: { id: companyId },
    });
  }
  
  return { user, companyId, company, currency };
}


