import type { NextConfig } from "next";

// LEARN: This file holds settings for the whole Next.js app.
// We keep it small so you can learn the basics first.
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
