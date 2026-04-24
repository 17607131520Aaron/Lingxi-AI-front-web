import type { NextConfig } from "next";

const API_PROXY_TARGET = process.env.API_PROXY_TARGET ?? "http://127.0.0.1:9000";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    return process.env.NODE_ENV === "development"
      ? [
          {
            source: "/api/:path*",
            destination: `${API_PROXY_TARGET}/:path*`,
          },
        ]
      : [];
  },
};

export default nextConfig;
