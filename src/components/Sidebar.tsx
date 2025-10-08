"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface User {
  id: number;
  email: string;
  name?: string;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

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

  const isActive = (path: string) => pathname === path;

  const navItems = [
    { href: "/", label: "Home", icon: "🏠" },
    { href: "/ingredients", label: "Ingredients", icon: "🥘" },
    { href: "/recipes", label: "Recipes", icon: "📖" },
    { href: "/pricing", label: "Pricing", icon: "💳" },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-lg hover:bg-gray-50 transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-gradient-to-b from-indigo-600 to-indigo-800 text-white z-40 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 w-72 shadow-2xl`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section - Much Bigger! */}
          <div className="p-8 border-b border-white/10">
            <Link href="/" onClick={() => setIsOpen(false)} className="block">
              <div className="flex items-center gap-4 group">
                <img
                  src="/images/plato-logo.svg"
                  alt="Plato"
                  className="h-16 w-16 transition-transform group-hover:scale-110 drop-shadow-lg"
                />
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Plato</h1>
                  <p className="text-indigo-200 text-sm mt-1">Recipe Management</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive(item.href)
                    ? "bg-white text-indigo-700 shadow-lg scale-105"
                    : "text-white/90 hover:bg-white/10 hover:text-white hover:translate-x-1"
                }`}
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="font-medium text-lg">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User Section */}
          <div className="p-6 border-t border-white/10">
            {loading ? (
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-10 h-10 rounded-full bg-white/20 animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 bg-white/20 rounded animate-pulse mb-2"></div>
                  <div className="h-3 bg-white/20 rounded animate-pulse w-2/3"></div>
                </div>
              </div>
            ) : user ? (
              <div className="space-y-2">
                <Link
                  href="/account"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive("/account")
                      ? "bg-white text-indigo-700 shadow-lg"
                      : "text-white/90 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">
                    {user.name?.[0] || user.email[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user.name || "My Account"}</p>
                    <p className="text-sm opacity-75 truncate">{user.email}</p>
                  </div>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-white/90 hover:bg-red-500/20 hover:text-red-200 transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="block w-full px-4 py-3 rounded-xl text-center font-medium bg-white/10 hover:bg-white/20 transition-all duration-200"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsOpen(false)}
                  className="block w-full px-4 py-3 rounded-xl text-center font-medium bg-white text-indigo-700 hover:bg-white/90 transition-all duration-200 shadow-lg"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

