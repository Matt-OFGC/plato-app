import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { InstallPrompt } from "@/components/InstallPrompt";
import { PerformanceMonitor } from "@/components/PerformanceMonitor";

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
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json?v=2" />
        <meta name="theme-color" content="#059669" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Plato" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png?v=2" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Force remove dark class on mount and prevent it from being added
                if (typeof document !== 'undefined') {
                  document.documentElement.classList.remove('dark');
                  const observer = new MutationObserver(function(mutations) {
                    if (document.documentElement.classList.contains('dark')) {
                      document.documentElement.classList.remove('dark');
                    }
                  });
                  observer.observe(document.documentElement, {
                    attributes: true,
                    attributeFilter: ['class']
                  });
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white transition-colors duration-200`}>
        <Providers>
          {children}
        </Providers>
        <InstallPrompt />
        <PerformanceMonitor />
      </body>
    </html>
  );
}
