import { redirect } from "next/navigation";

interface Props { 
  params: Promise<{ id: string }> 
}

export default async function IngredientEditRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/dashboard/ingredients/${id}`);
}
