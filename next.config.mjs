import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Build-Version',
            value: "0.9.0-DEADLOCK-FIX",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

/*
export default withSentryConfig(nextConfig, {
  org: "noyan-pi",
  project: "javascript-nextjsmirros",
  silent: true,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true,
});
*/
