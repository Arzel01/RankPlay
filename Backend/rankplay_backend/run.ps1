# Script para iniciar el servidor Django en modo desarrollo
# Accesible desde la red local para testing con dispositivos móviles

Write-Host "Iniciando servidor Django en 0.0.0.0:8000..." -ForegroundColor Green
Write-Host "Accesible desde:" -ForegroundColor Yellow
Write-Host "  - Local: http://localhost:8000" -ForegroundColor Cyan
Write-Host "  - Red: http://192.168.100.23:8000" -ForegroundColor Cyan
Write-Host ""

python manage.py runserver 0.0.0.0:8000
