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
  // Generar build optimizado para producción
  output: 'standalone',
  
  // No usamos basePath para evitar problemas de rutas
  basePath: '',
  
  // Configuración crítica para resolver errores 404
  // Esto debería coincidir con la ubicación desde donde se servirán los archivos estáticos
  assetPrefix: '/_next',

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
    // Deshabilitar la optimización para evitar problemas en producción
    unoptimized: true,
  },
};

module.exports = nextConfig;
