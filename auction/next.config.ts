import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [
    "*.ngrok-free.dev",
    "*.ngrok-free.app",
    "*.ngrok.io",
    "localhost:3002",
    "localhost:3005",
    "127.0.0.1:3002",
  ],
};

export default nextConfig;
