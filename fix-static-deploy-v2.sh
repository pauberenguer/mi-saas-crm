#!/bin/bash

# Script para arreglar problemas de archivos estáticos en Next.js (versión 2)
echo "🚀 Iniciando solución alternativa para archivos estáticos..."

# Definir rutas
PROJECT_DIR="/var/www/mi-saas-crm"
NEXT_DIR="$PROJECT_DIR/.next"
STATIC_DIR="$NEXT_DIR/static"
STATIC_WEB_DIR="$PROJECT_DIR/public/static-assets"

# 1. Eliminar la carpeta _next de public si existe (causa errores)
echo "🧹 Limpiando directorios conflictivos..."
rm -rf "$PROJECT_DIR/public/_next"

# 2. Crear directorio para archivos estáticos en la carpeta public
echo "📂 Creando directorio para archivos estáticos..."
mkdir -p $STATIC_WEB_DIR

# 3. Primero configuramos Next.js para usar nuestra ruta personalizada
echo "🔧 Actualizando configuración de Next.js..."
cat > $PROJECT_DIR/next.config.js << 'EOL'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  poweredByHeader: false,
  compress: true,
  
  // Usar standalone para optimizar el build
  output: 'standalone',
  
  // No usamos basePath para evitar problemas de rutas
  basePath: '',
  
  // Usar ruta personalizada para assets
  assetPrefix: '/static-assets',
  
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

# 4. Recompilar la aplicación con la nueva configuración
echo "🔨 Reconstruyendo la aplicación..."
cd $PROJECT_DIR
npm run build

# 5. Copiar los archivos estáticos del build a nuestra ubicación personalizada
echo "📋 Copiando archivos estáticos..."
if [ -d "$STATIC_DIR" ]; then
  cp -r $STATIC_DIR/* $STATIC_WEB_DIR/
  
  # Verificar que los archivos se copiaron correctamente
  echo "✅ Archivos copiados. Verificando..."
  ls -la $STATIC_WEB_DIR
else
  echo "⚠️ No se encontró el directorio de estáticos: $STATIC_DIR"
  echo "⚠️ Buscando archivos estáticos en otras ubicaciones..."
  find $NEXT_DIR -name "*.js" -o -name "*.css" | head -10
fi

# 6. Crear archivo .htaccess con reglas para servir archivos estáticos
echo "📝 Creando archivo .htaccess..."
cat > $PROJECT_DIR/.htaccess << 'EOL'
# Configuración para Next.js
<IfModule mod_rewrite.c>
  RewriteEngine On
  
  # Archivos estáticos: Ruta personalizada
  RewriteRule ^static-assets/(.*)$ /public/static-assets/$1 [L]
  
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
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType text/javascript "access plus 1 month"
</IfModule>
EOL

# 7. Añadir un archivo index.html a la carpeta static-assets para verificar acceso
echo "📄 Creando archivo de prueba para verificar acceso..."
cat > $STATIC_WEB_DIR/test.txt << 'EOL'
Este archivo es una prueba para verificar que la carpeta static-assets es accesible directamente.
Si puedes ver este archivo en tu navegador accediendo a /static-assets/test.txt, entonces la configuración es correcta.
EOL

# 8. Reiniciar la aplicación
echo "🔄 Reiniciando la aplicación..."
pm2 restart mi-saas-crm

echo "✅ Proceso completado. Verifica la aplicación en el navegador."
echo "🧪 Prueba de acceso: Intenta acceder a https://145.223.33.226/static-assets/test.txt"
echo "   Si puedes ver el archivo de prueba, la configuración está correcta."
echo ""
echo "🔍 Si persisten los problemas, prueba estas soluciones adicionales:"
echo "  1. Verifica la configuración del servidor web (Apache/Nginx)"
echo "     - Asegúrate de que la carpeta /public es accesible desde la web"
echo "     - Revisa los permisos de los archivos (chmod -R 755 public)"
echo "  2. Intenta una configuración más simple sin assetPrefix"
echo "  3. Considera desplegar con un servidor web dedicado para archivos estáticos" 