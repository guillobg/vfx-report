import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the DevSpaces proxy host to load Next.js dev resources (HMR, bundles)
  // during local development only. Not applied in production builds.
  ...(process.env.NODE_ENV === "development"
    ? {
        allowedDevOrigins: [
          "ds-hocqu40s--3000.eu-central-1.prod.proxy.devspaces.amazon.dev",
        ],
      }
    : {}),
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },
};

export default nextConfig;
