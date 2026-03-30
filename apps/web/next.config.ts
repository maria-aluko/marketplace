import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  webpack(config) {
    config.ignoreWarnings = [
      { module: /@opentelemetry\/instrumentation/ },
      { module: /require-in-the-middle/ },
      { module: /@fastify\/otel/ },
    ];
    return config;
  },
};

export default nextConfig;
