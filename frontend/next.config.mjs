/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
      {
        source: '/speech/:path*',
        destination: 'http://localhost:8000/speech/:path*',
      },
    ];
  },
};

export default nextConfig;
