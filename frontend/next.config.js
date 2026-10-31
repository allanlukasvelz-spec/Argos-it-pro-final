/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: __dirname
  },
  async rewrites() {
    if (process.env.ARGOS_E2E_API_REWRITE === "1") {
      const backend = process.env.BACKEND_URL || "http://127.0.0.1:4000";
      return [{ source: "/api/:path*", destination: `${backend}/api/:path*` }];
    }
    return [];
  },
  async redirects() {
    return [
      { source: "/legal/aviso-legal", destination: "/aviso-legal", permanent: true },
      { source: "/legal/privacidad", destination: "/privacidad", permanent: true },
      { source: "/legal/cookies", destination: "/cookies", permanent: true }
    ];
  }
};

module.exports = nextConfig;
