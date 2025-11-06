import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { checkRecipesLimits } from "@/lib/features";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limits = await checkRecipesLimits(session.id);

    return NextResponse.json(limits);
  } catch (error) {
    console.error("Get limits error:", error);
    return NextResponse.json(
      { error: "Failed to get limits" },
      { status: 500 }
    );
  }
}

