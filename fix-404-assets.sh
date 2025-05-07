#!/bin/bash

# =============================================================
# Script solución definitiva para archivos estáticos 404 en Next.js
# =============================================================

echo "🚀 Iniciando solución definitiva para errores 404 en archivos estáticos..."

# Definir rutas
PROJECT_DIR="/var/www/mi-saas-crm"
NEXT_DIR="$PROJECT_DIR/.next"
PUBLIC_DIR="$PROJECT_DIR/public"
STANDALONE_DIR="$NEXT_DIR/standalone"

# 1. Limpieza previa
echo "🧹 Limpiando configuraciones anteriores..."
rm -rf "$PUBLIC_DIR/_next"
rm -rf "$PUBLIC_DIR/static-assets"

# 2. Asegurarse de que el proyecto está usando la configuración optimizada
echo "📝 Aplicando configuración optimizada de Next.js..."
cp $PROJECT_DIR/next.config.js $PROJECT_DIR/next.config.js.backup
cat > $PROJECT_DIR/next.config.js << 'EOL'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  poweredByHeader: false,
  compress: true,
  
  // Generar build optimizado para producción
  output: 'standalone',
  
  // No usamos basePath para evitar problemas de rutas
  basePath: '',
  
  // Configuración para resolver errores 404
  assetPrefix: '/_next',
  
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
    unoptimized: true,
  },
};
module.exports = nextConfig;
EOL

# 3. Reconstruir la aplicación
echo "🔨 Reconstruyendo la aplicación con la configuración optimizada..."
cd $PROJECT_DIR
npm run build

# 4. Crear directorio _next en public y copiar archivos estáticos
echo "📂 Copiando archivos estáticos a ubicación accesible..."
mkdir -p "$PUBLIC_DIR/_next"
cp -r "$NEXT_DIR/static" "$PUBLIC_DIR/_next/"

# 5. Verificar que los archivos se copiaron correctamente
echo "✅ Verificando archivos copiados..."
if [ -d "$PUBLIC_DIR/_next/static" ]; then
  echo "   ✓ Archivos estáticos copiados correctamente"
  ls -la "$PUBLIC_DIR/_next/static" | head -5
else
  echo "   ❌ Error: No se pudieron copiar los archivos estáticos"
  exit 1
fi

# 6. Configurar el servidor web (detección automática)
echo "🔧 Configurando servidor web..."

# Detectar si estamos usando Apache o Nginx
if command -v apache2 &> /dev/null || [ -d "/etc/apache2" ]; then
  echo "   📌 Detectado Apache - Configurando .htaccess..."
  cat > $PROJECT_DIR/.htaccess << 'EOL'
<IfModule mod_rewrite.c>
  RewriteEngine On
  
  # Servir archivos estáticos directamente desde la carpeta public/_next
  RewriteRule ^_next/static/(.*)$ public/_next/static/$1 [L]
  
  # Archivos estáticos adicionales
  RewriteCond %{REQUEST_FILENAME} -f
  RewriteRule ^ - [L]
  
  # Redirigir todo lo demás a través de Next.js
  RewriteRule ^ http://localhost:3000%{REQUEST_URI} [P,L]
  
  # Importante para reescrituras de proxy
  ProxyPassReverse / http://localhost:3000/
</IfModule>

# Configuración de caché para archivos estáticos
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
</IfModule>
EOL
  echo "   ✓ Configuración de Apache aplicada"
  
elif command -v nginx &> /dev/null || [ -d "/etc/nginx" ]; then
  echo "   📌 Detectado Nginx - Creando configuración..."
  cat > /tmp/nextjs-site.conf << 'EOL'
server {
    listen 80;
    server_name _;  # Ajustar con tu dominio
    
    root /var/www/mi-saas-crm;
    
    # Servir archivos estáticos directamente
    location /_next/static/ {
        alias /var/www/mi-saas-crm/public/_next/static/;
        expires 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files $uri $uri/ =404;
    }
    
    # Servir archivos del directorio public
    location / {
        try_files $uri $uri/ @nextjs;
    }
    
    # Proxy para Next.js
    location @nextjs {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOL
  echo "   ✓ Configuración de Nginx generada en /tmp/nextjs-site.conf"
  echo "   ⚠️ Ejecuta los siguientes comandos para activar la configuración:"
  echo "      sudo cp /tmp/nextjs-site.conf /etc/nginx/sites-available/nextjs-site.conf"
  echo "      sudo ln -s /etc/nginx/sites-available/nextjs-site.conf /etc/nginx/sites-enabled/"
  echo "      sudo nginx -t && sudo systemctl restart nginx"
else
  echo "   ⚠️ No se pudo detectar el servidor web. Configuración manual requerida."
fi

# 7. Crear archivo de verificación para probar acceso
echo "🧪 Creando archivo de prueba para verificar acceso..."
cat > $PUBLIC_DIR/_next/test.txt << 'EOL'
Este archivo confirma que los archivos estáticos de Next.js están correctamente configurados.
Si puedes ver este archivo en tu navegador accediendo a /_next/test.txt, entonces la configuración es correcta.
EOL

# 8. Establecer permisos adecuados
echo "🔒 Estableciendo permisos adecuados..."
chmod -R 755 $PUBLIC_DIR

# 9. Reiniciar la aplicación
echo "🔄 Reiniciando la aplicación..."
if command -v pm2 &> /dev/null; then
  pm2 restart mi-saas-crm || echo "   ⚠️ Error al reiniciar con PM2. Reinicia manualmente."
else
  echo "   ⚠️ PM2 no encontrado. Reinicia la aplicación manualmente."
fi

echo ""
echo "✅ Proceso completado!"
echo "🌐 Verifica la aplicación en tu navegador"
echo "🧪 Prueba de acceso: intenta acceder a https://tu-dominio.com/_next/test.txt"
echo ""
echo "Si aún experimentas problemas, considera:"
echo "  1. Verificar los logs del servidor web (/var/log/nginx/error.log o /var/log/apache2/error.log)"
echo "  2. Comprobar que Node.js está ejecutando la aplicación en el puerto 3000"
echo "  3. Revisar permisos de archivos y directorios en $PROJECT_DIR" 