import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
            <a href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Plato
            </a>
            <nav className="flex items-center gap-6 text-sm font-medium">
              <a href="/ingredients" className="text-gray-700 hover:text-blue-600 transition-colors">Ingredients</a>
              <a href="/recipes" className="text-gray-700 hover:text-blue-600 transition-colors">Recipes</a>
              <a href="/pricing" className="text-gray-700 hover:text-blue-600 transition-colors">Pricing</a>
              {session?.user ? (
                <div className="flex items-center gap-4">
                  <span className="text-gray-600 text-sm">{session.user.email}</span>
                  <Link href="/account" className="text-gray-700 hover:text-blue-600 transition-colors">Account</Link>
                  <a href="/api/auth/signout" className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">
                    Sign out
                  </a>
                </div>
              ) : (
                <Link href="/login" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Sign in
                </Link>
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
