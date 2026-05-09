/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: __dirname
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
