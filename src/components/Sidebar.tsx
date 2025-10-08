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
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const isActive = (path: string) => pathname === path;

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: "🏠" },
    { href: "/dashboard/ingredients", label: "Ingredients", icon: "🥘" },
    { href: "/dashboard/recipes", label: "Recipes", icon: "📖" },
    { href: "/dashboard/account", label: "Account", icon: "⚙️" },
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
        className={`fixed left-0 top-0 h-full bg-white z-40 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 w-64 shadow-xl border-r border-gray-200`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-5 border-b border-gray-100">
            <Link href="/dashboard" onClick={() => setIsOpen(false)} className="block">
              <div className="flex items-center gap-3 group">
                <div className="relative">
                  <img
                    src="/images/plato-logo.svg"
                    alt="Plato"
                    className="h-10 w-10 transition-transform group-hover:scale-110"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 tracking-tight">Plato</h1>
                  <p className="text-emerald-600 text-xs font-semibold">Kitchen Manager</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 py-2 mb-1">
              Menu
            </div>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive(item.href)
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm"
                    : "text-gray-700 hover:bg-emerald-50 hover:text-emerald-600"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className={`text-sm font-medium ${isActive(item.href) ? "font-semibold" : ""}`}>
                  {item.label}
                </span>
                {isActive(item.href) && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white"></div>
                )}
              </Link>
            ))}
          </nav>

          {/* User Section */}
          <div className="p-3 border-t border-gray-100 bg-gray-50">
            {loading ? (
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-2.5 bg-gray-200 rounded animate-pulse w-2/3"></div>
                </div>
              </div>
            ) : user ? (
              <div className="space-y-1">
                <Link
                  href="/dashboard/account"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    isActive("/dashboard/account")
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                    {user.name?.[0] || user.email[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{user.name || "My Account"}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Link
                  href="/login?redirect=/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="block w-full px-3 py-2 rounded-lg text-center text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-all duration-200"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsOpen(false)}
                  className="block w-full px-3 py-2 rounded-lg text-center text-sm font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:shadow-md transition-all duration-200"
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

