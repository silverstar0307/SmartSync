import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable native SWC binary (required when Windows Application Control blocks .node files)
  experimental: {
    swcPlugins: [],
  },
  async rewrites() {
    const rawBackendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
    const backendBase = rawBackendUrl.replace(/\/api(\/v1)?\/?$/, '')
    return [
      {
        source: '/api/:path*',
        destination: `${backendBase}/api/:path*`,
      },
    ]
  },
};

export default nextConfig;
