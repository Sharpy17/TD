import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      // The demo project's address before the DaiHub rebrand; keeps old links and bookmarks working.
      { source: "/projects/toguz-hub", destination: "/projects/daihub", permanent: true },
      { source: "/projects/toguz-hub/:path*", destination: "/projects/daihub/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
