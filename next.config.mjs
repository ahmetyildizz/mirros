/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Build-Version',
            value: '0.1.2-FINAL',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
