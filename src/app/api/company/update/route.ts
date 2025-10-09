import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";

export async function POST(request: NextRequest) {
  try {
    const { companyId } = await getCurrentUserAndCompany();
    
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 404 });
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
    console.error("Error updating company:", error);
    return NextResponse.json({ error: "Failed to update company" }, { status: 500 });
  }
}
