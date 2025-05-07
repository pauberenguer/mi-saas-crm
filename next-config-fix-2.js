/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  poweredByHeader: false,
  compress: true,
  
  // Desactivar el output standalone ya que puede estar causando problemas
  // output: 'standalone',
  
  // Usar una ruta absoluta en lugar de relativa
  // Ajustamos para que coincida con el path donde están servidos los archivos estáticos
  // Si tu sitio está en https://145.223.33.226/mi-saas-crm
  basePath: '',
  assetPrefix: 'https://145.223.33.226',
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cuyrdzzqlzibyketxrlk.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/avatars/**',
      },
    ],
    domains: ['cuyrdzzqlzibyketxrlk.supabase.co', '145.223.33.226'],
    unoptimized: true,
  },
};

module.exports = nextConfig; 