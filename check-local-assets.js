#!/usr/bin/env node

/**
 * Script para diagnosticar problemas con archivos estáticos de Next.js
 * Versión para desarrollo local en Windows
 */

const fs = require('fs');
const path = require('path');

// Configuración
const PROJECT_DIR = '.';
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

// Imprime el encabezado
log('\n📊 DIAGNÓSTICO DE ARCHIVOS ESTÁTICOS NEXT.JS (LOCAL) 📊\n', 'cyan');

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

// 3. Resumen y soluciones
log('\n3. RECOMENDACIONES', 'magenta');

if (!directoryExists(PUBLIC_STATIC_DIR)) {
  log('  ❗ Crear directorio public/_next/static y copiar archivos:', 'yellow');
  log('    mkdir -p public/_next/static', 'blue');
  log('    copy .next\\static\\* public\\_next\\static\\ /s', 'blue');
}

log('\n📝 RESULTADO DEL DIAGNÓSTICO', 'cyan');
log('  Para solucionar automáticamente estos problemas, ejecuta:', 'green');
log('  bash fix-local-404.sh', 'blue');
log('\n  Después, inicia la aplicación con:', 'cyan');
log('  npm run start', 'blue');
log('\n  Verifica en el navegador:', 'cyan');
log('  http://localhost:3000', 'blue');
log('  http://localhost:3000/_next/test.txt', 'blue'); 