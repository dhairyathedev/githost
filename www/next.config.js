/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
          {
            source: '/backend/api/:path*',
            destination: 'http://localhost:3001/:path*',
          },
        ];
      },
};

module.exports = nextConfig;
