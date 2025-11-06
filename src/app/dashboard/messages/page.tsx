import { redirect } from "next/navigation";
import { getUserFromSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import MessagingPageClient from "./MessagingPageClient";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Team Chat - Plato",
  description: "Internal team messaging and collaboration",
};

export default async function MessagingPage() {
  const user = await getUserFromSession();

  if (!user?.id) {
    redirect("/login");
  }

  const userId = user.id;

  // Get user's company
  const membership = await prisma.membership.findFirst({
    where: { userId, isActive: true },
    include: { company: true },
  });

  if (!membership) {
    redirect("/onboarding");
  }

  // Get all channels user is a member of
  const channelsRaw = await prisma.channel.findMany({
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

  // Serialize Date objects to ISO strings for client component
  const channels = channelsRaw.map(channel => ({
    ...channel,
    updatedAt: channel.updatedAt.toISOString(),
    createdAt: channel.createdAt.toISOString(),
    messages: channel.messages.map(msg => ({
      ...msg,
      createdAt: msg.createdAt.toISOString(),
    })),
  }));

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
