#!/bin/bash

# Script de despliegue completo para la aplicación Next.js
echo "🚀 Iniciando despliegue de la aplicación mi-saas-crm..."

# Configuración
APP_DIR="/var/www/mi-saas-crm"
BACKUP_DIR="$APP_DIR/backup-$(date +%Y%m%d-%H%M%S)"

# 1. Crear copia de seguridad
echo "📦 Creando copia de seguridad..."
mkdir -p $BACKUP_DIR
cp -r $APP_DIR/.next $BACKUP_DIR/.next 2>/dev/null || echo "  • No hay directorio .next para respaldar"
cp $APP_DIR/next.config.js $BACKUP_DIR/next.config.js 2>/dev/null || echo "  • No hay archivo next.config.js para respaldar"

# 2. Actualizar código fuente (usando git)
echo "📥 Actualizando código fuente..."
cd $APP_DIR
git pull

# 3. Instalar dependencias
echo "🔧 Instalando dependencias..."
npm ci --production

# 4. Compilar la aplicación
echo "🔨 Compilando la aplicación..."
npm run build

# 5. Solución de archivos estáticos 404
echo "🛠️ Aplicando solución para archivos estáticos..."
chmod +x $APP_DIR/fix-404-assets.sh
$APP_DIR/fix-404-assets.sh

# 6. Reiniciar la aplicación
echo "🔄 Reiniciando la aplicación..."
pm2 restart mi-saas-crm || echo "⚠️ Error al reiniciar con PM2. Intenta reiniciar manualmente."

# 7. Verificar despliegue
echo "✅ Despliegue completado"
echo "🌐 Verifica la aplicación en tu navegador"
echo ""
echo "🔍 Si encuentras problemas con archivos estáticos 404:"
echo "  • Ejecuta: node $APP_DIR/check-assets.js para diagnosticar"
echo "  • Revisa: $APP_DIR/SOLUCION-DEFINITIVA.md para más información" 