import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";

export async function getCurrentUserAndCompany() {
  const session = await getSession();
  if (!session) return { user: null, companyId: null, currency: "GBP" };
  
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: { memberships: true, preferences: true },
  });
  
  if (!user) return { user: null, companyId: null, currency: "GBP" };
  const membership = user.memberships[0] || null;
  const currency = user.preferences?.currency ?? "GBP";
  return { user, companyId: membership?.companyId ?? null, currency };
}


