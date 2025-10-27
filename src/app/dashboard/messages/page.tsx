import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MessagingPageClient from "./MessagingPageClient";

export const metadata = {
  title: "Team Chat - Plato",
  description: "Internal team messaging and collaboration",
};

export default async function MessagingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const userId = parseInt(session.user.id);

  // Get user's company
  const membership = await prisma.membership.findFirst({
    where: { userId, isActive: true },
    include: { company: true },
  });

  if (!membership) {
    redirect("/onboarding");
  }

  // Get all channels user is a member of
  const channels = await prisma.channel.findMany({
    where: {
      companyId: membership.companyId,
      members: {
        some: { userId },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      messages: {
        take: 1,
        orderBy: { createdAt: "desc" },
        include: {
          sender: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Get all company team members for DM creation
  const teamMembers = await prisma.membership.findMany({
    where: {
      companyId: membership.companyId,
      isActive: true,
      userId: { not: userId },
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return (
    <MessagingPageClient
      userId={userId}
      companyId={membership.companyId}
      channels={channels}
      teamMembers={teamMembers}
    />
  );
}
