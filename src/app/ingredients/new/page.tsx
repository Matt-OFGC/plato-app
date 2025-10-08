import { redirect } from "next/navigation";

export default function NewIngredientRedirect() {
  redirect("/dashboard/ingredients/new");
}
