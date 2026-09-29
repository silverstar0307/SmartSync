import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable native SWC binary (required when Windows Application Control blocks .node files)
  experimental: {
    swcPlugins: [],
  },
};

export default nextConfig;
