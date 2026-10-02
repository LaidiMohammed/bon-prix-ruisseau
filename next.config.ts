import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.6"],
  async headers() {
    return [
      {
        // Big static JSON (wilayas + communes): cache 1 year on CDN + browser.
        // One download per user, then zero server hits even with many users.
        source: "/data/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
