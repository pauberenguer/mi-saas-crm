# Solución Definitiva para Errores 404 en Archivos Estáticos de Next.js

Este documento contiene la solución definitiva para resolver los errores 404 en archivos estáticos (JS/CSS) cuando se despliega una aplicación Next.js en un servidor VPS.

## El Problema

Los archivos estáticos generados por Next.js no se sirven correctamente en el entorno de producción, lo que resulta en:

- Errores 404 para archivos JavaScript (`.js`)
- Errores 404 para archivos CSS (`.css`)
- La aplicación se ve diferente en el servidor comparada con localhost
- Errores en la consola del navegador

## Solución Paso a Paso

Hemos creado un script automatizado que soluciona este problema. Sigue estos pasos:

### 1. Ejecuta el Script de Solución

```bash
# Accede a tu servidor VPS
ssh usuario@tu-servidor

# Navega al directorio de tu aplicación
cd /var/www/mi-saas-crm

# Otorga permisos de ejecución al script
chmod +x fix-404-assets.sh

# Ejecuta el script
./fix-404-assets.sh
```

### 2. Qué Hace el Script

El script realiza automáticamente los siguientes pasos clave:

1. **Configura correctamente Next.js**:
   - Usa `output: 'standalone'` para optimizar el build
   - Configura `assetPrefix: '/_next'` para las rutas correctas
   - Optimiza la configuración de imágenes

2. **Copia los archivos estáticos** a una ubicación accesible por el servidor web:
   - Crea `public/_next/static` con todos los archivos
   - Establece permisos adecuados

3. **Configura automáticamente el servidor web**:
   - **Para Apache**: Genera un archivo `.htaccess` optimizado
   - **Para Nginx**: Crea un archivo de configuración en `/tmp/nextjs-site.conf`

4. **Verifica la instalación** creando un archivo de prueba accesible.

### 3. Verificación

Después de ejecutar el script:

1. Verifica que puedes acceder a `https://tu-dominio.com/_next/test.txt`
2. Comprueba que tu aplicación se carga correctamente sin errores 404
3. Revisa la consola del navegador (F12) para confirmar que no hay errores

## Configuración Manual (Si el Script Falla)

Si el script automatizado no funciona, puedes seguir estos pasos manuales:

### Para Nginx

1. Crea un archivo de configuración específico para Next.js:

```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    
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
```

2. Activa la configuración:

```bash
sudo cp tu-config.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/tu-config.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
```

### Para Apache

1. Crea un archivo `.htaccess` en la raíz de tu aplicación:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  
  # Servir archivos estáticos desde la carpeta public/_next
  RewriteRule ^_next/static/(.*)$ public/_next/static/$1 [L]
  
  # Redirigir todo lo demás a través de Next.js
  RewriteRule ^ http://localhost:3000%{REQUEST_URI} [P,L]
  
  # Importante para reescrituras de proxy
  ProxyPassReverse / http://localhost:3000/
</IfModule>
```

2. Asegúrate de que los módulos necesarios estén activados:

```bash
sudo a2enmod rewrite proxy proxy_http
sudo systemctl restart apache2
```

## Problemas Comunes y Soluciones

### Si sigues viendo errores 404:

1. **Verifica los logs del servidor web**:
   ```bash
   sudo tail -f /var/log/nginx/error.log
   # o
   sudo tail -f /var/log/apache2/error.log
   ```

2. **Comprueba que Next.js está ejecutándose**:
   ```bash
   pm2 list
   # Debería mostrar tu aplicación ejecutándose en el puerto 3000
   ```

3. **Revisa la estructura de archivos**:
   ```bash
   ls -la /var/www/mi-saas-crm/public/_next/static
   # Debería mostrar tus archivos estáticos
   ```

4. **Comprueba los permisos de archivos**:
   ```bash
   sudo chmod -R 755 /var/www/mi-saas-crm/public
   sudo chown -R www-data:www-data /var/www/mi-saas-crm/public
   ```

## Soporte Adicional

Si continúas teniendo problemas después de seguir todas estas instrucciones, considera lo siguiente:

1. Revisa la [documentación oficial de Next.js sobre despliegue](https://nextjs.org/docs/deployment)
2. Considera un servicio de hosting optimizado para Next.js como Vercel
3. Utiliza un CDN para servir tus archivos estáticos 