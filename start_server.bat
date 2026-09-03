@echo off
cd /d "%~dp0"
title RobosMDP - Iniciador de Servidor

echo ====================================================
echo        RobosMDP - Servidor de Desarrollo
echo ====================================================
echo.

:: 1. Verificar si ya hay un proceso corriendo en el puerto 5173
echo Verificando disponibilidad del puerto 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING 2^>nul') do (
    echo [!] El puerto 5173 ya esta en uso por el proceso PID %%a.
    echo [!] Cerrando instancia previa...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo Iniciando servidor Vite en una nueva ventana...
start "RobosMDP Dev Server" cmd /c "npm run dev"

:: 2. Esperar 2 segundos a que el servidor levante antes de abrir el navegador
ping 127.0.0.1 -n 3 >nul

:: 3. Abrir la aplicacion en el navegador predeterminado
echo Abriendo http://localhost:5173 en el navegador...
start http://localhost:5173

echo.
echo ====================================================
echo  [OK] Servidor iniciado correctamente.
echo  Puedes detenerlo ejecutando: stop_server.bat
echo ====================================================
ping 127.0.0.1 -n 3 >nul
exit /b 0
