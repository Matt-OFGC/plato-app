import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function TestAccountPage() {
  try {
    const session = await auth();
    if (!session?.user?.email) redirect("/login");
    
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Test Account Page</h1>
        <p>Session: {session?.user?.email}</p>
        <p>Status: Working</p>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">Error</h1>
        <p>Error: {String(error)}</p>
      </div>
    );
  }
}
