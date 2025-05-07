#!/bin/bash

# Script para implementar los cambios de configuración en el servidor
echo "🚀 Iniciando implementación de configuración..."

# Definir colores para mensajes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar si estamos en la carpeta correcta
if [ ! -f "fix-server-config.js" ] || [ ! -f "SERVIDOR.md" ]; then
  echo -e "${RED}❌ Error: No estás en la carpeta correcta. Asegúrate de ejecutar este script desde la carpeta config-para-servidor${NC}"
  exit 1
fi

# Copiar archivos a las ubicaciones correctas
echo -e "${YELLOW}Copiando archivos de configuración...${NC}"

# Copiar archivos en la raíz del proyecto
cp tailwind.config.js ../
cp next.config.js ../
cp fix-server-config.js ../

# Crear directorios si no existen
mkdir -p ../src/app

# Copiar archivos de la aplicación
cp src/app/globals.css ../src/app/
cp src/app/layout.tsx ../src/app/

echo -e "${GREEN}✅ Archivos copiados correctamente${NC}"

# Ejecutar el script de corrección
echo -e "${YELLOW}Ejecutando script de verificación de configuración...${NC}"
cd ..
node fix-server-config.js

# Reconstruir la aplicación
echo -e "${YELLOW}Reconstruyendo la aplicación...${NC}"
npm run build

echo -e "${GREEN}✅ Implementación completada${NC}"
echo -e "${YELLOW}ℹ️ Para iniciar la aplicación, ejecuta:${NC}"
echo -e "   ${GREEN}npm start${NC}"
echo -e "   o si usas PM2:"
echo -e "   ${GREEN}pm2 restart mi-saas-crm${NC} (si ya existe)"
echo -e "   ${GREEN}pm2 start npm --name \"mi-saas-crm\" -- start${NC} (para nueva instancia)" 