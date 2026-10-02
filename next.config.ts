import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.6"],
  poweredByHeader: false, // ne pas annoncer Next.js (moins d'infos pour les scanners)
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
      {
        // Clickjacking / MIME-sniffing / referrer leaks: bloqués partout.
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
