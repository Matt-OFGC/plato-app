import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

interface Props { params: Promise<{ id: string }> }

export default async function EditRecipePage({ params }: Props) {
  const { id } = await params;
  
  // Redirect to the unified recipe page with edit mode
  redirect(`/dashboard/recipes/new?edit=${id}`);
}