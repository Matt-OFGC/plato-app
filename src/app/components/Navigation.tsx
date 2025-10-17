"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface User {
  id: number;
  email: string;
  name?: string;
}

export function Navigation() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/session")
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, []);

  const handleSignOut = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      setUser(null);
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  if (loading) {
    return (
      <nav className="flex items-center gap-8 text-sm font-medium">
        <div className="h-6 w-20 bg-gray-200 animate-pulse rounded"></div>
      </nav>
    );
  }

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
      {user ? (
        <div className="flex items-center gap-4">
          <span className="text-[var(--muted-foreground)] text-sm">{user.email}</span>
          <Link 
            href="/account" 
            className="text-[var(--foreground)] hover:text-[var(--primary)] transition-all duration-200 ease-in-out hover:scale-105 active:scale-95"
          >
            My Account
          </Link>
          <button 
            onClick={handleSignOut}
            className="btn-outline text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
          >
            Sign out
          </button>
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
