import { deleteRecipe } from "../actions";
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

    await deleteRecipe(recipeId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting recipe:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete recipe";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

