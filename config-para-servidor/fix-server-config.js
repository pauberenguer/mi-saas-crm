// Script para verificar y corregir problemas de configuración en el servidor
const fs = require('fs');
const path = require('path');

// Función para verificar si un archivo existe
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    console.error(`Error al verificar archivo ${filePath}:`, err);
    return false;
  }
}

// Función para crear un archivo con contenido
function createFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Archivo creado: ${filePath}`);
  } catch (err) {
    console.error(`❌ Error al crear archivo ${filePath}:`, err);
  }
}

// Verificar tailwind.config.js
const tailwindConfigPath = path.join(process.cwd(), 'tailwind.config.js');
if (!fileExists(tailwindConfigPath)) {
  const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
    },
  },
  plugins: [],
}`;
  createFile(tailwindConfigPath, tailwindConfig);
}

// Verificar configuración de Next.js
const nextConfigPath = path.join(process.cwd(), 'next.config.js');
if (fileExists(nextConfigPath)) {
  try {
    let nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
    let modified = false;
    
    // Verificar y añadir compress si no existe
    if (!nextConfigContent.includes('compress:')) {
      nextConfigContent = nextConfigContent.replace(
        'const nextConfig = {',
        'const nextConfig = {\n  /*  ───── Optimizaciones para producción ───── */\n  poweredByHeader: false,\n  compress: true,\n'
      );
      modified = true;
    }
    
    // Verificar y añadir domains para imágenes si no existe
    if (!nextConfigContent.includes('domains:')) {
      nextConfigContent = nextConfigContent.replace(
        /images:\s*{([^}]*)}/s,
        (match, p1) => {
          if (!p1.includes('domains:')) {
            return `images: {${p1},\n    // Permite dominios para imágenes\n    domains: ['cuyrdzzqlzibyketxrlk.supabase.co'],\n  }`;
          }
          return match;
        }
      );
      modified = true;
    }
    
    // Guardar si hubo cambios
    if (modified) {
      fs.writeFileSync(nextConfigPath, nextConfigContent);
      console.log(`✅ next.config.js actualizado`);
    } else {
      console.log(`ℹ️ next.config.js ya está configurado correctamente`);
    }
  } catch (err) {
    console.error(`❌ Error al modificar next.config.js:`, err);
  }
}

// Verificar configuración del tema en globals.css
const globalsCssPath = path.join(process.cwd(), 'src/app/globals.css');
if (fileExists(globalsCssPath)) {
  try {
    let globalsCssContent = fs.readFileSync(globalsCssPath, 'utf8');
    let modified = false;
    
    // Verificar si ya existe la clase .dark
    if (!globalsCssContent.includes('.dark {')) {
      // Añadir clase dark para el tema oscuro
      globalsCssContent = globalsCssContent.replace(
        ':root {',
        ':root {\n  --background: #ffffff;\n  --foreground: #171717;\n}\n\n.dark {\n  --background: #0a0a0a;\n  --foreground: #ededed;\n}\n\n:root {'
      );
      modified = true;
    }
    
    // Comentar la detección automática por preferencias de sistema si existe
    if (globalsCssContent.includes('@media (prefers-color-scheme: dark)') && 
        !globalsCssContent.includes('/* @media (prefers-color-scheme: dark)')) {
      globalsCssContent = globalsCssContent.replace(
        /@media \(prefers-color-scheme: dark\) {[\s\S]*?}/,
        '/* Eliminamos la detección automática por preferencias de sistema */\n/* $& */'
      );
      modified = true;
    }
    
    // Actualizar las fuentes si es necesario
    if (globalsCssContent.includes('--font-geist-sans') || 
        globalsCssContent.includes('--font-geist-mono')) {
      globalsCssContent = globalsCssContent.replace(
        /--font-sans:.*?;/,
        '--font-sans: system-ui, -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Arial, sans-serif;'
      );
      globalsCssContent = globalsCssContent.replace(
        /--font-mono:.*?;/,
        '--font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;'
      );
      modified = true;
    }
    
    // Guardar si hubo cambios
    if (modified) {
      fs.writeFileSync(globalsCssPath, globalsCssContent);
      console.log(`✅ globals.css actualizado`);
    } else {
      console.log(`ℹ️ globals.css ya está configurado correctamente`);
    }
  } catch (err) {
    console.error(`❌ Error al modificar globals.css:`, err);
  }
}

// Verificar manejo del tema en layout.tsx
const layoutPath = path.join(process.cwd(), 'src/app/layout.tsx');
if (fileExists(layoutPath)) {
  try {
    let layoutContent = fs.readFileSync(layoutPath, 'utf8');
    let modified = false;
    
    // Verificar si ya contiene la gestión del tema
    if (!layoutContent.includes('setTheme')) {
      // Añadir imports necesarios
      if (!layoutContent.includes('useState')) {
        layoutContent = layoutContent.replace(
          /import {(.*)} from "react";/,
          'import {$1, useState} from "react";'
        );
      }
      
      // Añadir estado para manejar el tema
      if (!layoutContent.includes('const [theme, setTheme]')) {
        layoutContent = layoutContent.replace(
          /const audioRef = useRef<HTMLAudioElement>\(null\);/,
          'const audioRef = useRef<HTMLAudioElement>(null);\n  \n  // Estado para controlar el tema de la interfaz\n  const [theme, setTheme] = useState<\'light\' | \'dark\'>(\'light\');\n  \n  useEffect(() => {\n    // Detectar preferencia de tema del sistema\n    const mediaQuery = window.matchMedia(\'(prefers-color-scheme: dark)\');\n    setTheme(mediaQuery.matches ? \'dark\' : \'light\');\n    \n    // Escuchar cambios en la preferencia de tema\n    const handler = (e: MediaQueryListEvent) => setTheme(e.matches ? \'dark\' : \'light\');\n    mediaQuery.addEventListener(\'change\', handler);\n    \n    return () => mediaQuery.removeEventListener(\'change\', handler);\n  }, []);'
        );
        modified = true;
      }
      
      // Añadir la clase del tema al elemento HTML
      if (!layoutContent.includes('<html lang="es" className={theme}>')) {
        layoutContent = layoutContent.replace(
          /<html lang="es">/,
          '<html lang="es" className={theme}>'
        );
        modified = true;
      }
      
      // Añadir clases de Tailwind para el tema
      if (!layoutContent.includes('bg-background text-foreground')) {
        layoutContent = layoutContent.replace(
          /<body className="(.*)">/,
          '<body className="$1 bg-background text-foreground">'
        );
        modified = true;
      }
    }
    
    // Guardar si hubo cambios
    if (modified) {
      fs.writeFileSync(layoutPath, layoutContent);
      console.log(`✅ layout.tsx actualizado`);
    } else {
      console.log(`ℹ️ layout.tsx ya está configurado correctamente`);
    }
  } catch (err) {
    console.error(`❌ Error al modificar layout.tsx:`, err);
  }
}

console.log('\n🚀 Verificación de configuración completada');
console.log('ℹ️ Para aplicar los cambios, ejecute:');
console.log('   1. npm run build');
console.log('   2. npm start'); 