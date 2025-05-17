/**
 * @type {import('next').NextConfig}
 *
 * Configuración central de Next 15 para “mi-saas-crm”
 * — React Strict, ajustes de producción y alias «@/» →
 *   <raíz>/src  (para que Webpack resuelva imports "@/…")
 */

const path = require('path');

const nextConfig = {
  /* ───── Comportamiento de React/Next ───── */
  reactStrictMode: true,

  /* ───── Linter y TypeScript en CI ───── */
  eslint:     { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  /* ───── Optimizaciones para producción ───── */
  poweredByHeader: false,
  compress: true,

  /* ───── Configura el entorno de producción ───── */
  output: 'standalone',   // genera build independiente
  basePath: '',           // sin prefijo de rutas
  assetPrefix: '/_next',  // ruta estática que sirve Nginx

  /* ───── Alias “@/” para Webpack (Next 15 no lo crea) ───── */
  webpack: (config) => {
    // "@/utils/…" → /var/www/mi-saas-crm/src/utils/…
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },

  /* ───── Carga de imágenes remotas ───── */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cuyrdzzqlzibyketxrlk.supabase.co',
        pathname: '/storage/v1/object/public/avatars/**',
      },
    ],
    domains: ['cuyrdzzqlzibyketxrlk.supabase.co'],
    unoptimized: true, // evita problemas de optimización en prod
  },
};

module.exports = nextConfig;
