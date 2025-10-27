import { getMockRecipeById } from "@/lib/mocks/recipe";
import RecipeRedesignClient from "./RecipeRedesignClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RecipeRedesignPage({ params }: Props) {
  const { id } = await params;
  const recipe = await getMockRecipeById(id);

  return <RecipeRedesignClient recipe={recipe} />;
}

