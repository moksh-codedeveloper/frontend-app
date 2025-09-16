import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/ws/files/:path*',              // Frontend route
        destination: 'http://localhost:8000/ws/files/:path*', // Backend route
      },
    ];
  },
};

export default nextConfig;
