# Script para subir los archivos al VPS y ejecutar los comandos necesarios
Write-Host "Subiendo archivos al VPS..." -ForegroundColor Yellow

# Ejecutar el comando SCP para subir el archivo ZIP
$host_vps = "pauberenguer@145.223.33.226"
$destination = "/var/www/mi-saas-crm/"

# Copiar el archivo ZIP al VPS
Write-Host "Copiando config-para-servidor.zip al servidor remoto" -ForegroundColor Yellow
scp config-para-servidor.zip "$host_vps`:$destination"

# Ejecutar comandos en el VPS vía SSH
Write-Host "Ejecutando comandos en el VPS..." -ForegroundColor Yellow
$commands = @"
cd $destination
unzip -o config-para-servidor.zip
cd config-para-servidor
chmod +x implementar-en-servidor.sh
./implementar-en-servidor.sh
"@

Write-Host "Conectando por SSH para ejecutar los comandos..." -ForegroundColor Yellow
$commands | ssh $host_vps

Write-Host "¡Proceso completado!" -ForegroundColor Green 