import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { preferences: true } });
  if (!user) redirect("/login");

  async function action(formData: FormData) {
    "use server";
    const currency = String(formData.get("currency") || "GBP");
    await prisma.userPreference.upsert({
      where: { userId: user.id },
      create: { userId: user.id, currency },
      update: { currency },
    });
    return redirect("/account");
  }

  return (
    <div className="mx-auto max-w-lg p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Account Preferences</h1>
      <form action={action} className="space-y-3">
        <div>
          <label className="mb-1 block text-sm">Currency</label>
          <select name="currency" defaultValue={user.preferences?.currency ?? "GBP"} className="w-full rounded border px-3 py-2">
            <option value="GBP">GBP (£)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
          </select>
        </div>
        <button className="rounded bg-blue-600 px-4 py-2 text-white">Save</button>
      </form>
    </div>
  );
}


