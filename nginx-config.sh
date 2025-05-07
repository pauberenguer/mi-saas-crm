#!/bin/bash

# Script para crear la configuración de Nginx para Next.js
echo "🚀 Creando configuración de Nginx para Next.js..."

# Obtener el directorio actual
PROJECT_DIR=$(pwd)
DOMAIN=$(hostname -f)

# Crear archivo de configuración
CONFIG_FILE="/tmp/nextjs-site.conf"

cat > $CONFIG_FILE << EOL
server {
    listen 80;
    server_name $DOMAIN;

    # Configuración para servir archivos estáticos de Next.js
    location /_next/static/ {
        alias $PROJECT_DIR/.next/static/;
        expires 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location /_next/data/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # Servir archivos estáticos desde public
    location / {
        # Primero intentar servir archivos estáticos
        root $PROJECT_DIR/public;
        try_files \$uri @nextjs;
    }

    location @nextjs {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

echo "✅ Configuración de Nginx creada en: $CONFIG_FILE"
echo "📋 Para implementarla, ejecuta como root:"
echo "   sudo cp $CONFIG_FILE /etc/nginx/sites-available/nextjs-site.conf"
echo "   sudo ln -s /etc/nginx/sites-available/nextjs-site.conf /etc/nginx/sites-enabled/"
echo "   sudo nginx -t && sudo systemctl restart nginx"

# Instrucciones adicionales en caso de que no puedas modificar Nginx
echo ""
echo "🔍 Si no puedes modificar la configuración de Nginx, intenta esto:"
echo "1. Crea una carpeta 'public-static' en el directorio del proyecto:"
echo "   mkdir -p $PROJECT_DIR/public-static/_next"
echo ""
echo "2. Copia los archivos estáticos a esta carpeta:"
echo "   cp -r $PROJECT_DIR/.next/static $PROJECT_DIR/public-static/_next/"
echo ""
echo "3. Configura tu servidor web para servir la carpeta 'public-static'"
echo "   directamente como archivos estáticos."
echo ""
echo "4. O modifica next.config.js para usar una ruta diferente para assets:"
echo "```"
echo "/** @type {import('next').NextConfig} */"
echo "const nextConfig = {"
echo "  output: 'standalone',"
echo "  assetPrefix: 'https://$DOMAIN/static',"
echo "};"
echo "module.exports = nextConfig;"
echo "```"

# Crear directorio de assets estáticos alternativos
mkdir -p $PROJECT_DIR/public-static/_next
cp -r $PROJECT_DIR/.next/static $PROJECT_DIR/public-static/_next/
echo ""
echo "✅ Se ha creado un directorio 'public-static' con todos los assets"
echo "   Puedes configurar tu servidor web para servirlo directamente." 