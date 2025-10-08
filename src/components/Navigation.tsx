"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export function Navigation() {
  const { data: session } = useSession();

  return (
    <nav className="flex items-center gap-8 text-sm font-medium">
      <Link 
        href="/ingredients" 
        className="text-[var(--foreground)] hover:text-[var(--primary)] transition-all duration-200 ease-in-out hover:scale-105 active:scale-95"
      >
        Ingredients
      </Link>
      <Link 
        href="/recipes" 
        className="text-[var(--foreground)] hover:text-[var(--primary)] transition-all duration-200 ease-in-out hover:scale-105 active:scale-95"
      >
        Recipes
      </Link>
      <Link 
        href="/pricing" 
        className="text-[var(--foreground)] hover:text-[var(--primary)] transition-all duration-200 ease-in-out hover:scale-105 active:scale-95"
      >
        Pricing
      </Link>
      {session?.user ? (
        <div className="flex items-center gap-4">
          <span className="text-[var(--muted-foreground)] text-sm">{session.user.email}</span>
          <Link 
            href="/account" 
            className="text-[var(--foreground)] hover:text-[var(--primary)] transition-all duration-200 ease-in-out hover:scale-105 active:scale-95"
          >
            My Account
          </Link>
          <a 
            href="/api/auth/signout" 
            className="btn-outline text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
          >
            Sign out
          </a>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <Link 
            href="/login" 
            className="text-[var(--foreground)] hover:text-[var(--primary)] transition-all duration-200 ease-in-out hover:scale-105 active:scale-95"
          >
            Sign In
          </Link>
          <Link 
            href="/register" 
            className="btn-primary"
          >
            Get Started
          </Link>
        </div>
      )}
    </nav>
  );
}
