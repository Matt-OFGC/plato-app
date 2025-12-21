import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { companyId, user } = await getCurrentUserAndCompany();
    
    if (!companyId || !user) {
      return NextResponse.json({ error: "No company found" }, { status: 404 });
    }

    // Check if user has ADMIN or OWNER role (required for company settings)
    const membership = await prisma.membership.findUnique({
      where: {
        userId_companyId: {
          userId: user.id,
          companyId,
        },
      },
      select: {
        role: true,
        isActive: true,
      },
    });

    if (!membership || !membership.isActive || (membership.role !== "ADMIN" && membership.role !== "OWNER")) {
      return NextResponse.json({ error: "No permission to manage company settings" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      businessType,
      country,
      phone,
      email,
      website,
      address,
      city,
      postcode,
      logoUrl,
      profileBio,
      showTeam,
      showContact,
      isProfilePublic,
    } = body;

    // Update company
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        name,
        businessType: businessType || null,
        country: country || null,
        phone: phone || null,
        email: email || null,
        website: website || null,
        address: address || null,
        city: city || null,
        postcode: postcode || null,
        logoUrl: logoUrl || null,
        profileBio: profileBio || null,
        showTeam: showTeam || false,
        showContact: showContact || false,
        isProfilePublic: isProfilePublic || false,
      },
    });

    return NextResponse.json({ success: true, company: updatedCompany });
  } catch (error) {
    logger.error("Error updating company", error, "Company/Update");
    return NextResponse.json({ error: "Failed to update company" }, { status: 500 });
  }
}
