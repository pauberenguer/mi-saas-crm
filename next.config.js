/** @type {import('next').NextConfig} */
const nextConfig = {
  /*  ───── Comportamiento de React/Next ───── */
  reactStrictMode: true,

  /*  ───── Linter y TypeScript en CI ───── */
  eslint:     { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  /*  ───── Optimizaciones para producción ───── */
  poweredByHeader: false,
  compress: true,
  
  /*  ───── Configura el entorno de producción ───── */
  // Descomentar y ajustar si sirves desde una ruta que no es la raíz del dominio
  // basePath: '',
  // assetPrefix: '',

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
    // Permite dominios para imágenes
    domains: ['cuyrdzzqlzibyketxrlk.supabase.co'],
  },

  /*  ───── IMPORTANTE ─────
      Si sirves desde un subdirectorio, usa:
      basePath: '/tu-subdirectorio'
      assetPrefix: '/tu-subdirectorio'
  */
};

module.exports = nextConfig;
