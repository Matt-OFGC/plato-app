import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { auth } from "@/lib/auth";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Plato - Let us do the thinking for you",
  description: "Seamless ingredient and recipe management with automatic cost calculation and unit conversion",
  icons: {
    icon: '/favicon.svg',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let session = null;
  try {
    session = await auth();
  } catch (error) {
    console.error("Auth error in layout:", error);
  }
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <header className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
          <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
            <a href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <img 
                src="/images/plato-logo.svg" 
                alt="Plato" 
                className="h-8 w-auto"
              />
            </a>
            <nav className="flex items-center gap-8 text-sm font-medium">
              <a href="/ingredients" className="text-gray-700 hover:text-indigo-600 transition-colors">Ingredients</a>
              <a href="/recipes" className="text-gray-700 hover:text-indigo-600 transition-colors">Recipes</a>
              <a href="/pricing" className="text-gray-700 hover:text-indigo-600 transition-colors">Pricing</a>
              {session?.user ? (
                <div className="flex items-center gap-4">
                  <span className="text-gray-500 text-sm">{session.user.email}</span>
                  <Link href="/account" className="text-gray-700 hover:text-indigo-600 transition-colors">My Account</Link>
                  <a href="/api/auth/signout" className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">
                    Sign out
                  </a>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link href="/login" className="text-gray-700 hover:text-indigo-600 transition-colors">
                    Sign in
                  </Link>
                  <Link href="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
                    Get Started
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
