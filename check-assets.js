#!/usr/bin/env node

/**
 * Script para diagnosticar problemas con archivos estáticos de Next.js
 * 
 * Este script verifica:
 * 1. La estructura de directorios de Next.js
 * 2. La configuración del servidor web
 * 3. Los permisos de archivos
 * 4. La accesibilidad de los archivos estáticos
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuración
const PROJECT_DIR = '/var/www/mi-saas-crm';
const NEXT_DIR = path.join(PROJECT_DIR, '.next');
const PUBLIC_DIR = path.join(PROJECT_DIR, 'public');
const STATIC_DIR = path.join(NEXT_DIR, 'static');
const PUBLIC_STATIC_DIR = path.join(PUBLIC_DIR, '_next/static');

// Colores para la terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Función para imprimir con color
function log(text, color = 'reset') {
  console.log(`${colors[color]}${text}${colors.reset}`);
}

// Función para verificar si un directorio existe
function directoryExists(dir) {
  try {
    return fs.existsSync(dir) && fs.statSync(dir).isDirectory();
  } catch (err) {
    return false;
  }
}

// Función para verificar si un archivo existe
function fileExists(file) {
  try {
    return fs.existsSync(file) && fs.statSync(file).isFile();
  } catch (err) {
    return false;
  }
}

// Función para ejecutar un comando
function runCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' });
  } catch (err) {
    return null;
  }
}

// Imprime el encabezado
log('\n📊 DIAGNÓSTICO DE ARCHIVOS ESTÁTICOS NEXT.JS 📊\n', 'cyan');

// 1. Verifica la estructura de directorios
log('1. ESTRUCTURA DE DIRECTORIOS', 'magenta');
const directories = [
  { path: NEXT_DIR, name: '.next' },
  { path: STATIC_DIR, name: '.next/static' },
  { path: PUBLIC_DIR, name: 'public' },
  { path: PUBLIC_STATIC_DIR, name: 'public/_next/static' },
];

directories.forEach(dir => {
  const exists = directoryExists(dir.path);
  log(`  ${exists ? '✅' : '❌'} ${dir.name}`, exists ? 'green' : 'red');
  
  if (exists) {
    try {
      const stats = fs.statSync(dir.path);
      const permissions = stats.mode.toString(8).slice(-3);
      log(`    • Permisos: ${permissions}`, permissions >= '755' ? 'green' : 'yellow');
      
      const files = fs.readdirSync(dir.path);
      log(`    • Contiene ${files.length} archivos/directorios`, files.length > 0 ? 'green' : 'yellow');
      
      if (files.length > 0 && ['public/_next/static', '.next/static'].includes(dir.name)) {
        log(`    • Ejemplos: ${files.slice(0, 3).join(', ')}...`, 'blue');
      }
    } catch (err) {
      log(`    • Error al leer el directorio: ${err.message}`, 'red');
    }
  }
});

// 2. Verifica next.config.js
log('\n2. CONFIGURACIÓN DE NEXT.JS', 'magenta');
const nextConfigPath = path.join(PROJECT_DIR, 'next.config.js');
if (fileExists(nextConfigPath)) {
  log('  ✅ next.config.js encontrado', 'green');
  try {
    const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
    
    const hasStandalone = nextConfig.includes('output: \'standalone\'') || 
                           nextConfig.includes('output: "standalone"');
    log(`  ${hasStandalone ? '✅' : '❌'} output: 'standalone'`, hasStandalone ? 'green' : 'red');
    
    const assetPrefixMatch = nextConfig.match(/assetPrefix:\s*['"](.*)['"],?/);
    const assetPrefix = assetPrefixMatch ? assetPrefixMatch[1] : '';
    log(`  ℹ️ assetPrefix: '${assetPrefix || '(no configurado)'}'`, 'blue');
    
    const imagesUnoptimized = nextConfig.includes('unoptimized: true');
    log(`  ℹ️ images.unoptimized: ${imagesUnoptimized ? 'true' : 'false'}`, 'blue');
  } catch (err) {
    log(`  ❌ Error al leer next.config.js: ${err.message}`, 'red');
  }
} else {
  log('  ❌ next.config.js no encontrado', 'red');
}

// 3. Verificar configuración del servidor web
log('\n3. CONFIGURACIÓN DEL SERVIDOR WEB', 'magenta');
const nginxActive = runCommand('command -v nginx') !== null || directoryExists('/etc/nginx');
const apacheActive = runCommand('command -v apache2') !== null || directoryExists('/etc/apache2');

if (nginxActive) {
  log('  ✅ Nginx detectado', 'green');
  const nginxConfigMatch = runCommand('grep -r "/_next/static" /etc/nginx/sites-enabled/ 2>/dev/null');
  log(`  ${nginxConfigMatch ? '✅' : '❌'} Configuración para archivos estáticos`, nginxConfigMatch ? 'green' : 'red');
}

if (apacheActive) {
  log('  ✅ Apache detectado', 'green');
  const htaccessPath = path.join(PROJECT_DIR, '.htaccess');
  const htaccessExists = fileExists(htaccessPath);
  log(`  ${htaccessExists ? '✅' : '❌'} Archivo .htaccess`, htaccessExists ? 'green' : 'red');
  
  if (htaccessExists) {
    const htaccess = fs.readFileSync(htaccessPath, 'utf8');
    const hasRewriteRules = htaccess.includes('RewriteRule') && 
                            (htaccess.includes('_next/static') || htaccess.includes('static-assets'));
    log(`  ${hasRewriteRules ? '✅' : '❌'} Reglas de reescritura para archivos estáticos`, hasRewriteRules ? 'green' : 'red');
  }
  
  const modulesEnabled = runCommand('apache2ctl -M 2>/dev/null | grep -E "rewrite|proxy"');
  log(`  ${modulesEnabled ? '✅' : '❌'} Módulos rewrite/proxy habilitados`, modulesEnabled ? 'green' : 'red');
}

// 4. Verificar proceso Node.js
log('\n4. PROCESO NODE.JS', 'magenta');
const pm2Running = runCommand('command -v pm2') !== null && 
                   runCommand('pm2 list 2>/dev/null | grep mi-saas-crm') !== null;
log(`  ${pm2Running ? '✅' : '❌'} PM2 ejecutando la aplicación`, pm2Running ? 'green' : 'red');

// 5. Recomendaciones
log('\n5. RECOMENDACIONES', 'magenta');

if (!directoryExists(PUBLIC_STATIC_DIR)) {
  log('  ❗ Crear directorio public/_next/static y copiar archivos:', 'yellow');
  log('    mkdir -p public/_next/static', 'blue');
  log('    cp -r .next/static/* public/_next/static/', 'blue');
}

if (nginxActive && !runCommand('grep -r "/_next/static" /etc/nginx/sites-enabled/ 2>/dev/null')) {
  log('  ❗ Configurar Nginx para servir archivos estáticos:', 'yellow');
  log('    Añadir la configuración en /tmp/nextjs-site.conf a tu configuración de Nginx', 'blue');
}

if (apacheActive && !fileExists(path.join(PROJECT_DIR, '.htaccess'))) {
  log('  ❗ Crear archivo .htaccess con reglas para archivos estáticos', 'yellow');
}

log('\n📝 RESULTADO DEL DIAGNÓSTICO', 'cyan');
log('  Para solucionar automáticamente estos problemas, ejecuta:', 'green');
log('  ./fix-404-assets.sh', 'blue');
log('\n  Para más información, consulta SOLUCION-DEFINITIVA.md\n', 'green'); 