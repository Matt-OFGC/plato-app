"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export function Navigation() {
  const { data: session } = useSession();

  return (
    <nav className="flex items-center gap-8 text-sm font-medium">
      <Link href="/ingredients" className="text-gray-700 hover:text-indigo-600 transition-colors">Ingredients</Link>
      <Link href="/recipes" className="text-gray-700 hover:text-indigo-600 transition-colors">Recipes</Link>
      <Link href="/pricing" className="text-gray-700 hover:text-indigo-600 transition-colors">Pricing</Link>
      {session?.user ? (
        <div className="flex items-center gap-4">
          <span className="text-gray-500 text-sm">{session.user.email}</span>
          <Link href="/account" className="text-gray-700 hover:text-indigo-600 transition-colors">My Account</Link>
          <a href="/api/auth/signout" className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">
            Sign out
          </a>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-gray-700 hover:text-indigo-600 transition-colors">Sign In</Link>
          <Link href="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
            Get Started
          </Link>
        </div>
      )}
    </nav>
  );
}
