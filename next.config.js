/** @type {import('next').NextConfig} */
const nextConfig = {
  /*  ───── Comportamiento de React/Next ───── */
  reactStrictMode: true,

  /*  ───── Linter y TypeScript en CI ───── */
  eslint:     { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  /*  ───── Carga de imágenes remotas ───── */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cuyrdzzqlzibyketxrlk.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/avatars/**',
      },
    ],
  },

  /*  ───── IMPORTANTE ─────
      No declares assetPrefix ni basePath
      porque sirves en la raíz del dominio.
  */
};

module.exports = nextConfig;
