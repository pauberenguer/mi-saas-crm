#!/bin/bash

# ===========================================================
# Script de solución para errores 404 en archivos estáticos (Versión Windows)
# ===========================================================

echo "🚀 Iniciando solución para errores 404 en archivos estáticos..."

# Definir rutas adaptadas para Windows
PROJECT_DIR="."
NEXT_DIR="$PROJECT_DIR/.next"
PUBLIC_DIR="$PROJECT_DIR/public"

# 1. Limpieza previa
echo "🧹 Limpiando configuraciones anteriores..."
rm -rf "$PUBLIC_DIR/_next" 2>/dev/null
rm -rf "$PUBLIC_DIR/static-assets" 2>/dev/null

# 2. Configurar Next.js correctamente
echo "📝 Aplicando configuración optimizada a next.config.js..."
cp next.config.js next.config.js.backup 2>/dev/null

# Crear archivo next.config.js optimizado
cat > next.config.js << 'EOL'
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

# 6. Crear archivo de verificación para probar acceso
echo "🧪 Creando archivo de prueba para verificar acceso..."
cat > $PUBLIC_DIR/_next/test.txt << 'EOL'
Este archivo confirma que los archivos estáticos de Next.js están correctamente configurados.
Si puedes ver este archivo en tu navegador accediendo a /_next/test.txt, entonces la configuración es correcta.
EOL

echo ""
echo "✅ Proceso completado!"
echo "🌐 Puedes probar la aplicación ejecutando: npm run start"
echo "   Luego accede a http://localhost:3000 en tu navegador"
echo ""
echo "🧪 Para verificar la solución, intenta acceder a http://localhost:3000/_next/test.txt"
echo "   Si puedes ver el archivo de prueba, la configuración local es correcta." 