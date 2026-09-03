@echo off
cd /d "%~dp0"
title RobosMDP - Detener Servidor

echo ====================================================
echo         RobosMDP - Detener Servidor
echo ====================================================
echo.

set FOUND=0

:: 1. Buscar procesos en escucha en el puerto 5173 (Vite)
echo Buscando procesos activos en el puerto 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING 2^>nul') do (
    set FOUND=1
    echo Cerrando proceso Node/Vite con PID: %%a ...
    taskkill /F /PID %%a >nul 2>&1
)

:: 2. Cerrar ventana asociada si sigue abierta
taskkill /FI "WINDOWTITLE eq RobosMDP Dev Server*" /T /F >nul 2>&1

echo.
if "%FOUND%"=="1" (
    echo ====================================================
    echo  [OK] El servidor de RobosMDP se ha detenido.
    echo ====================================================
) else (
    echo [INFO] No se encontro ningun servidor activo en el puerto 5173.
)

echo.
ping 127.0.0.1 -n 3 >nul
exit /b 0
