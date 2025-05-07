/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  poweredByHeader: false,
  compress: true,
  output: 'standalone',
  
  // Prueba estas tres opciones alternativas:
  // Opción 1 - Usar directorio public-static
  assetPrefix: '/public-static',
  
  // Opción 2 - Usar URL absoluta (reemplazar con tu dominio real)
  // assetPrefix: 'https://145.223.33.226',
  
  // Opción 3 - Usar path relativo
  // basePath: '',
  // assetPrefix: '',
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cuyrdzzqlzibyketxrlk.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/avatars/**',
      },
    ],
    domains: ['cuyrdzzqlzibyketxrlk.supabase.co'],
  },
};

module.exports = nextConfig; 