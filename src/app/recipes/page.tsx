import { redirect } from "next/navigation";

export default function RecipesRedirect() {
  redirect("/dashboard/recipes");
}