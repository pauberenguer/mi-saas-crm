# Solución a Problemas de 404 en Archivos Estáticos de Next.js

Este documento contiene instrucciones detalladas para solucionar el problema de archivos estáticos de Next.js que devuelven errores 404 en tu VPS.

## 1. Diagnóstico del Problema

Cuando ves errores 404 para archivos como:
- webpack-*.js
- *.js
- *.css
- *-*.js

Esto generalmente significa que:
1. Los archivos estáticos no se están sirviendo correctamente
2. La configuración del servidor web (Nginx/Apache) no está enrutando correctamente
3. La configuración de Next.js no es adecuada para el entorno de producción

## 2. Soluciones Implementadas

Hemos implementado varias soluciones para resolver este problema:

### 2.1. Configuración Optimizada de Next.js

Se ha actualizado `next.config.js` con:
- La opción `output: 'standalone'` para un mejor manejo de assets
- Opciones de compresión y optimización
- Preparación para configurar `basePath` y `assetPrefix` si es necesario

### 2.2. Enlaces Simbólicos para Archivos Estáticos

Se ha creado un script `create-static-links.sh` que:
- Crea enlaces simbólicos de los archivos estáticos en el directorio `public`
- Hace que los archivos estén disponibles directamente sin pasar por Next.js

### 2.3. Directorio Alternativo de Archivos Estáticos

Se ha creado un directorio `public-static` con:
- Una copia de todos los archivos estáticos de Next.js
- Estructura correspondiente a las rutas de la aplicación

## 3. Pasos para Corregir el Problema

Dependiendo de tu configuración de servidor, sigue estos pasos:

### Si usas Nginx:

1. Revisa el archivo generado en `/tmp/nextjs-site.conf`
2. Solicita a tu administrador de sistemas que:
   - Agregue la configuración a Nginx
   - Reinicie el servidor Nginx
   
   ```bash
   sudo cp /tmp/nextjs-site.conf /etc/nginx/sites-available/nextjs-site.conf
   sudo ln -s /etc/nginx/sites-available/nextjs-site.conf /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl restart nginx
   ```

### Si usas Apache:

1. Copia el archivo `nextjs-htaccess.txt` como `.htaccess` en la raíz de tu aplicación:
   ```bash
   cp /var/www/mi-saas-crm/nextjs-htaccess.txt /var/www/mi-saas-crm/.htaccess
   ```

2. Asegúrate de que los módulos necesarios estén habilitados:
   ```bash
   sudo a2enmod rewrite proxy proxy_http headers
   sudo systemctl restart apache2
   ```

### Si tienes acceso restringido al servidor web:

1. Usa la carpeta `public-static` que ya se ha creado:
   ```bash
   # Actualiza el directorio estático después de cada build
   cp -r /var/www/mi-saas-crm/.next/static /var/www/mi-saas-crm/public-static/_next/
   ```

2. Configura tu servidor web para servir el directorio `public-static` directamente como archivos estáticos.

3. Modifica `next.config.js` para apuntar a la ruta correcta:
   ```js
   const nextConfig = {
     // Otras configuraciones...
     assetPrefix: '/public-static',
   };
   ```

## 4. Verificación

Después de aplicar los cambios:

1. Reconstruye la aplicación:
   ```bash
   cd /var/www/mi-saas-crm
   npm run build
   ```

2. Reinicia el servidor Node.js:
   ```bash
   pm2 restart mi-saas-crm
   ```

3. Verifica en el navegador que los archivos estáticos ya no muestran errores 404.

## 5. Soluciones Adicionales

Si los problemas persisten:

1. **Servidor de archivos estáticos separado**: Configura un servidor web ligero (como Caddy o Nginx) dedicado exclusivamente a servir archivos estáticos.

2. **CDN para archivos estáticos**: Utiliza un CDN como Cloudflare, Vercel Edge o CloudFront para servir tus archivos estáticos.

3. **Exportar aplicación estática**: Si tu aplicación lo permite, considera usar `next export` para generar una versión completamente estática.

## 6. Contacto

Si necesitas ayuda adicional, consulta la documentación oficial de Next.js sobre [despliegue en producción](https://nextjs.org/docs/deployment) o contacta a tu administrador de sistemas. 