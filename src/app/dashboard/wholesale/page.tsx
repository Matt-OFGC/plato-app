import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { getCurrentUserAndCompany } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import WholesalePageClient from "./WholesalePageClient";

export const dynamic = 'force-dynamic';

export default async function WholesalePage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login?redirect=/dashboard/wholesale");

  const { companyId, currentUserRole } = await getCurrentUserAndCompany();
  if (!companyId) redirect("/dashboard");

  // Get suppliers (we'll create this model later)
  // For now, return empty array
  const suppliers: any[] = [];

  return (
    <WholesalePageClient
      companyId={companyId}
      currentUserRole={currentUserRole}
      suppliers={suppliers}
    />
  );
}
