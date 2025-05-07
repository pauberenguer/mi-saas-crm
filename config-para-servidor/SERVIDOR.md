# Instrucciones para Despliegue en VPS Hostinger

Este documento contiene instrucciones específicas para desplegar correctamente esta aplicación Next.js en un VPS de Hostinger.

## Preparación del Entorno

Antes de desplegar, asegúrate de tener Node.js (v18+) y npm instalados en tu VPS:

```bash
# Instalar NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
source ~/.bashrc

# Instalar Node.js
nvm install 18
nvm use 18

# Verificar instalación
node -v
npm -v
```

## Procedimiento de Despliegue

1. **Sube el código al servidor VPS** (usando SFTP, Git, etc.)

2. **Instala las dependencias**:
   ```bash
   cd /ruta/a/tu/proyecto
   npm install
   ```

3. **Ejecuta el script de verificación de configuración**:
   ```bash
   node fix-server-config.js
   ```

4. **Compila la aplicación**:
   ```bash
   npm run build
   ```

5. **Inicia la aplicación en modo producción**:
   ```bash
   npm start
   ```

## Ejecutar como Servicio

Para mantener la aplicación en ejecución incluso después de cerrar la terminal SSH:

1. **Instala PM2**:
   ```bash
   npm install -g pm2
   ```

2. **Inicia la aplicación con PM2**:
   ```bash
   cd /ruta/a/tu/proyecto
   pm2 start npm --name "mi-saas-crm" -- start
   ```

3. **Configura PM2 para iniciar automáticamente en el arranque**:
   ```bash
   pm2 startup
   # Ejecuta el comando que te sugiere PM2
   pm2 save
   ```

## Configuración de Nginx (si es necesario)

Si estás utilizando Nginx como proxy inverso:

```nginx
server {
    listen 80;
    server_name tudominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Solución de Problemas Comunes

### Diferencias visuales entre entornos

Si la aplicación se ve diferente en el VPS comparado con localhost:

1. **Verifica que todos los archivos se hayan subido correctamente**, especialmente:
   - tailwind.config.js
   - next.config.js
   - src/app/globals.css
   - src/app/layout.tsx

2. **Ejecuta el script de verificación**: `node fix-server-config.js`

3. **Asegúrate de usar la misma versión de Node.js** que en tu entorno local

4. **Reconstruye la aplicación después de los cambios**:
   ```bash
   npm run build
   pm2 restart mi-saas-crm
   ```

### Problemas de rutas o assets

Si hay problemas con rutas o recursos estáticos:

1. **Revisa next.config.js**: 
   - Si estás sirviendo desde un subdominio o carpeta, configura `basePath` y `assetPrefix`

2. **Asegúrate de que los archivos estáticos estén en la carpeta correcta**:
   - Las imágenes y otros recursos deben estar en `/public`

## Contacto

Si tienes problemas adicionales, consulta la documentación de Next.js o contacta al administrador del sistema. 