import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
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
  async redirects() {
    return [
      {
        source: "/portal-hult-8f4b2c1e9a7d/dashboard/student",
        destination: "/portal-hult-8f4b2c1e9a7d/dashboard/students",
        permanent: true,
      },
      {
        source: "/portal-hult-8f4b2c1e9a7d/dashboard/live",
        destination: "/portal-hult-8f4b2c1e9a7d/dashboard/live-event",
        permanent: true,
      },
      {
        source: "/portal-hult-8f4b2c1e9a7d/dashboard/user",
        destination: "/portal-hult-8f4b2c1e9a7d/dashboard/admins",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
