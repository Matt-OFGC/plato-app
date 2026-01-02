const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/middleware-manifest\.json$/],
  runtimeCaching: [
    // Static assets - Cache forever
    {
      urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60 // 365 days
        }
      }
    },
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|webp|avif)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
        }
      }
    },
    // API routes - Aggressive caching with background sync
    {
      urlPattern: /^\/api\/recipes.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'recipes-api',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        },
        backgroundSync: {
          name: 'recipes-sync',
          options: {
            maxRetentionTime: 24 * 60 // 24 minutes
          }
        }
      }
    },
    {
      urlPattern: /^\/api\/ingredients.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'ingredients-api',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        },
        backgroundSync: {
          name: 'ingredients-sync',
          options: {
            maxRetentionTime: 24 * 60 // 24 minutes
          }
        }
      }
    },
    {
      urlPattern: /^\/api\/suppliers.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'suppliers-api',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        }
      }
    },
    {
      urlPattern: /^\/api\/categories.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'categories-api',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
        }
      }
    },
    // Dashboard pages - Cache aggressively
    {
      urlPattern: /^\/dashboard\/recipes.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'recipes-page',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 // 1 hour
        }
      }
    },
    {
      urlPattern: /^\/dashboard\/ingredients.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'ingredients-page',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 // 1 hour
        }
      }
    },
    {
      urlPattern: /^\/dashboard\/account.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'account-page',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 30 * 60 // 30 minutes
        }
      }
    },
    // Static pages - Cache first
    {
      urlPattern: /^\/$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'home-page',
        expiration: {
          maxEntries: 1,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        }
      }
    },
    {
      urlPattern: /^\/login.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'auth-pages',
        expiration: {
          maxEntries: 5,
          maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
        }
      }
    },
    // Fallback for everything else
    {
      urlPattern: /.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'fallback',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        },
        networkTimeoutSeconds: 3
      }
    }
  ]
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove console logs in production builds
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'], // Keep error and warn logs for debugging
    } : false,
  },
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Performance optimizations
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: '*.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'blob.vercel-storage.com',
      },
    ],
    formats: ['image/webp', 'image/avif'], // Modern formats for better compression
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048], // Responsive breakpoints
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // Icon sizes
    minimumCacheTTL: 60 * 60 * 24 * 30, // Cache images for 30 days
    // Allow unoptimized images as fallback for external URLs
    unoptimized: false,
  },
  // Enable compression
  compress: true,
  // Reduce bundle size by removing unused code
  modularizeImports: {
    '@heroicons/react/24/outline': {
      transform: '@heroicons/react/24/outline/{{member}}',
    },
    '@heroicons/react/24/solid': {
      transform: '@heroicons/react/24/solid/{{member}}',
    },
  },
  // Headers for better caching
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
        ],
      },
      {
        source: '/images/:all*(svg|jpg|jpeg|png|gif|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Friendly routes
  async rewrites() {
    return [
      {
        source: '/settings',
        destination: '/dashboard/account',
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
