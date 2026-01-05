# Script para iniciar el servidor Django en modo desarrollo
# Accesible desde la red local para testing con dispositivos móviles

# Obtener IP local automáticamente
$localIP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Ethernet*","Wi-Fi*" | Where-Object {$_.IPAddress -like "192.168.*"} | Select-Object -First 1).IPAddress

if (-not $localIP) {
    $localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" -or $_.IPAddress -like "172.*"} | Select-Object -First 1).IPAddress
}

Write-Host "Iniciando servidor Django en 0.0.0.0:8000..." -ForegroundColor Green
Write-Host "Accesible desde:" -ForegroundColor Yellow
Write-Host "  - Local: http://localhost:8000" -ForegroundColor Cyan
if ($localIP) {
    Write-Host "  - Red Local: http://$localIP:8000" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "IMPORTANTE: Actualiza la IP en el frontend si es necesario" -ForegroundColor Yellow
    Write-Host "Frontend (services/api.ts): LOCAL_IP = '$localIP'" -ForegroundColor Magenta
} else {
    Write-Host "  - Red Local: No se pudo detectar IP local" -ForegroundColor Red
}
Write-Host ""

python manage.py runserver 0.0.0.0:8000
