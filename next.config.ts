import type { NextConfig } from "next";

const AI_PROXY_TARGET = "http://127.0.0.1:9011";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    return process.env.NODE_ENV === "development"
      ? [
          {
            source: "/api/:path*",
            destination: `${AI_PROXY_TARGET}/:path*`,
          },
        ]
      : [];
  },
};

export default nextConfig;
