/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Set your API URL in environment variable
  env: {
    API_URL: process.env.API_URL || 'http://localhost',
  },
  // Enable CORS for API requests
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_URL || "http://localhost"}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;