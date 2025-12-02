import { duplicateRecipe } from "../actions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recipeId = Number(id);
    
    if (isNaN(recipeId)) {
      return NextResponse.json({ error: "Invalid recipe ID" }, { status: 400 });
    }

    const result = await duplicateRecipe(recipeId);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to duplicate recipe" }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, recipeId: result.recipeId });
  } catch (error) {
    console.error("Error duplicating recipe:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to duplicate recipe";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

