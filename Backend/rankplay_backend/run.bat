@echo off
echo Iniciando servidor Django en 0.0.0.0:8000...
echo Accesible desde:
echo   - Local: http://localhost:8000
echo   - Red: http://192.168.100.23:8000
echo.
python manage.py runserver 0.0.0.0:8000
