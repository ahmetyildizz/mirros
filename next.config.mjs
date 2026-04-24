import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Build-Version',        value: "1.0.0-PROD-STABLE" },
          { key: 'X-Frame-Options',         value: 'DENY' },
          { key: 'X-Content-Type-Options',  value: 'nosniff' },
          { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',      value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=15552000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Pusher WebSocket + API
              "connect-src 'self' wss://*.pusher.com https://*.pusher.com https://sockjs-mt1.pusher.com https://sentry.io https://*.sentry.io",
              // Next.js scripts + Sentry
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://pagead2.googlesyndication.com",
              // Google Ads iframes
              "frame-src 'self' https://googleads.g.doubleclick.net https://www.google.com",
              // Images: Google avatars, Supabase, etc.
              "img-src 'self' data: blob: https://lh3.googleusercontent.com https://ui-avatars.com https://avatars.githubusercontent.com",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self' data:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: "noyan-pi",
  project: "javascript-nextjsmirros",
  silent: true,
  widenClientFileUpload: false,
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true,
  telemetry: false,
});
