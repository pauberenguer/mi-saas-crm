/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // en lugar de `domains`, definimos remotePatterns:
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cuyrdzzqlzibyketxrlk.supabase.co',
        port: '',
        // como tus imágenes vienen de /storage/v1/object/public/avatars/…
        pathname: '/storage/v1/object/public/avatars/**',
      },
    ],
  },
};

module.exports = nextConfig;
