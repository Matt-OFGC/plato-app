import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Sidebar } from "@/components/Sidebar";

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
  // Don't call auth() in layout to avoid dynamic server usage
  // Auth will be handled in individual pages that need it
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}>
        <Providers>
          <div className="flex min-h-screen">
            {/* Sidebar Navigation */}
            <Sidebar />
            
            {/* Main Content Area */}
            <main className="flex-1 lg:ml-72 transition-all duration-300">
              <div className="max-w-7xl mx-auto px-4 py-8 lg:px-8">
                {children}
              </div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
