#!/bin/bash

# Script para arreglar problemas de archivos estáticos en Next.js
echo "🚀 Iniciando solución alternativa para archivos estáticos..."

# Definir rutas
PROJECT_DIR="/var/www/mi-saas-crm"
NEXT_DIR="$PROJECT_DIR/.next"
STATIC_DIR="$NEXT_DIR/static"
STATIC_WEB_DIR="$PROJECT_DIR/public/static-assets"
PUBLIC_STATIC_DIR="$PROJECT_DIR/public/_next/static"

# 1. Crear directorio para archivos estáticos en la carpeta public
echo "📂 Creando directorio para archivos estáticos..."
mkdir -p $STATIC_WEB_DIR
mkdir -p $PUBLIC_STATIC_DIR

# 2. Copiar todos los archivos estáticos
echo "📋 Copiando archivos estáticos..."
# Método 1: Copiar a un directorio personalizado
cp -r $STATIC_DIR/* $STATIC_WEB_DIR/

# Método 2: Replicar la estructura exacta de Next.js
cp -r $STATIC_DIR/* $PUBLIC_STATIC_DIR/

# 3. Verificar que los archivos se copiaron correctamente
echo "✅ Archivos copiados. Verificando..."
ls -la $STATIC_WEB_DIR
echo "----------"
ls -la $PUBLIC_STATIC_DIR

# 4. Crear archivo de configuración de Next.js actualizado
echo "🔧 Actualizando configuración de Next.js..."
cat > $PROJECT_DIR/next.config.js << 'EOL'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  poweredByHeader: false,
  compress: true,
  
  // Desactivamos el output standalone para probar otra alternativa
  // output: 'standalone',
  
  // No usamos basePath para evitar problemas de rutas
  basePath: '',
  
  // Prueba diferentes opciones de assetPrefix
  assetPrefix: '/static-assets', // Apunta al directorio que creamos
  //assetPrefix: '/_next', // URL estándar de Next.js
  
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
    unoptimized: true, // Desactivar optimización para evitar problemas
  },
};
module.exports = nextConfig;
EOL

# 5. Crear archivo .htaccess con reglas para servir archivos estáticos
echo "📝 Creando archivo .htaccess..."
cat > $PROJECT_DIR/.htaccess << 'EOL'
# Configuración para Next.js
<IfModule mod_rewrite.c>
  RewriteEngine On
  
  # Archivos estáticos: Intenta primero el directorio personalizado
  RewriteRule ^static-assets/(.*)$ /public/static-assets/$1 [L]
  
  # Archivos estáticos: Estructura estándar de Next.js
  RewriteRule ^_next/static/(.*)$ /public/_next/static/$1 [L]
  
  # Si no existe un archivo o directorio real, redirigir a través de Node.js
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^ http://localhost:3000%{REQUEST_URI} [P,L]
  
  # Importante para reescrituras de proxy
  ProxyPassReverse / http://localhost:3000/
</IfModule>

# Configuración de caché para archivos estáticos
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType text/javascript "access plus 1 month"
</IfModule>
EOL

# 6. Recompilar la aplicación
echo "🔨 Reconstruyendo la aplicación..."
cd $PROJECT_DIR
npm run build

# 7. Volver a copiar archivos estáticos (por si cambió algo durante el build)
echo "📋 Actualizando archivos estáticos después del build..."
cp -r $STATIC_DIR/* $STATIC_WEB_DIR/
cp -r $STATIC_DIR/* $PUBLIC_STATIC_DIR/

# 8. Reiniciar la aplicación
echo "🔄 Reiniciando la aplicación..."
pm2 restart mi-saas-crm

echo "✅ Proceso completado. Verifica la aplicación en el navegador."
echo "🔍 Si persisten los problemas, prueba estas soluciones adicionales:"
echo "  1. Verifica la configuración del servidor web (Apache/Nginx)"
echo "  2. Asegúrate de que los directorios 'public' y '_next' sean accesibles"
echo "  3. Considera usar un CDN como Cloudflare para servir archivos estáticos" 