import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navigation } from "@/components/Navigation";

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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <header className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
            <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
              <a href="/" className="flex items-center hover:opacity-80 transition-opacity">
                <img 
                  src="/images/plato-logo.svg" 
                  alt="Plato" 
                  className="h-8 w-auto"
                />
              </a>
              <Navigation />
            </div>
          </header>
          <main className="mx-auto max-w-7xl px-4 py-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
