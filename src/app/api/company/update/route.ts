import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      companyId,
      name,
      businessType,
      phone,
      email,
      website,
      address,
      city,
      postcode,
      country,
      profileBio,
      isProfilePublic,
      showTeam,
      showContact,
    } = body;

    if (!companyId) {
      return NextResponse.json({ error: "Company ID required" }, { status: 400 });
    }

    // Check if user has access to this company
    const membership = await prisma.membership.findUnique({
      where: {
        userId_companyId: {
          userId: session.id,
          companyId: parseInt(companyId),
        },
      },
    });

    if (!membership || (membership.role !== "ADMIN" && membership.role !== "OWNER")) {
      return NextResponse.json({ error: "No permission to update company" }, { status: 403 });
    }

    // Update company
    const updatedCompany = await prisma.company.update({
      where: { id: parseInt(companyId) },
      data: {
        name: name || undefined,
        businessType: businessType || undefined,
        phone: phone || undefined,
        email: email || undefined,
        website: website || undefined,
        address: address || undefined,
        city: city || undefined,
        postcode: postcode || undefined,
        country: country || undefined,
        profileBio: profileBio !== undefined ? profileBio : undefined,
        isProfilePublic: isProfilePublic !== undefined ? isProfilePublic : undefined,
        showTeam: showTeam !== undefined ? showTeam : undefined,
        showContact: showContact !== undefined ? showContact : undefined,
      },
    });

    return NextResponse.json({ success: true, company: updatedCompany });
  } catch (error) {
    console.error("Company update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

