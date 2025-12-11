import { getUserFromSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { checkPermission } from "@/lib/permissions";
import { BrandingCustomization } from "./BrandingCustomization";

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CompanyBrandingPage({ params }: Props) {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  const { id } = await params;
  const companyId = parseInt(id);

  if (isNaN(companyId)) {
    redirect("/dashboard/companies");
  }

  // Verify user has permission
  const canManage = await checkPermission(user.id, companyId, "settings:edit");
  if (!canManage) {
    redirect("/dashboard/companies");
  }

  // Get company branding data
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      name: true,
      logoUrl: true,
    },
  });

  if (!company) {
    redirect("/dashboard/companies");
  }

  return (
    <BrandingCustomization company={company} />
  );
}
