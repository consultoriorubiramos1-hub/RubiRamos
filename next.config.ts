import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/**',
      },
    ],
    unoptimized: process.env.NODE_ENV === 'development',
    
    domains: [
      'res.cloudinary.com',
      'localhost', // Para desarrollo local
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Aumenta el límite a 10 MB
    },
  },
};

export default nextConfig;