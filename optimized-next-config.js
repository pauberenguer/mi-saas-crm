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
  
  /*  ───── Configuración crucial para assets ───── */
  // Esta configuración garantiza que los assets se sirvan correctamente
  output: 'standalone',
  
  // Descomenta y ajusta estas líneas si tu aplicación no se sirve desde la raíz del dominio
  // basePath: '/mi-saas-crm',
  // assetPrefix: '/mi-saas-crm',
  
  // Alternativa: Si tienes un dominio estático para assets (CDN o subdominio)
  // assetPrefix: 'https://static.tudominio.com',

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
};

module.exports = nextConfig; 