import { redirect } from "next/navigation";

interface Props { 
  params: Promise<{ id: string }> 
}

export default async function RecipeEditRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/dashboard/recipes/${id}`);
}