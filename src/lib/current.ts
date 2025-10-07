import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentUserAndCompany() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { user: null, companyId: null, currency: "GBP" };
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { memberships: true, preferences: true },
  });
  if (!user) return { user: null, companyId: null, currency: "GBP" };
  const membership = user.memberships[0] || null;
  const currency = user.preferences?.currency ?? "GBP";
  return { user, companyId: membership?.companyId ?? null, currency };
}


