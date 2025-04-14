@echo off
setlocal enabledelayedexpansion

:: Configuración
set "sourceFolder=C:\Users\1308l\HealthData\DBs"  
set "destinationFolder=C:\Users\1308l\OneDrive\Documentos\INGINF\S8\TFG\TFG_livelyAgeing\BackupDBGarmin"
::set "repoFolder=C:\Ruta\Del\Repositorio"
for /f "delims=" %%i in ('wmic os get localdatetime ^| find "."') do set datetime=%%i
set "timestamp=!datetime:~0,8!_!datetime:~8,6!"
set "backupName=backup_!timestamp!"
set "backupPath=%destinationFolder%\!backupName!"
set "zipPath=!backupPath!.zip"

:: 1. Copiar la carpeta al destino con la fecha en el nombre
xcopy /E /I /Y "%sourceFolder%" "!backupPath!"

:: 2. Comprimir la carpeta en un archivo ZIP
tar -a -c -f "!zipPath!" -C "%destinationFolder%" "!backupName!"

:: 3. Eliminar la carpeta sin comprimir
rmdir /S /Q "!backupPath!"

:: 4. Mantener solo los 3 archivos ZIP más recientes
pushd "%destinationFolder%"
for /f "skip=3 delims=" %%F in ('dir /b /o-d backup_*.zip') do del "%%F"
popd

:: 5. Subir los cambios a GitHub
::cd /d "%repoFolder%"
::git add .
::git commit -m "Backup generado el !timestamp!"
::git push origin main  REM Cambia "main" si tu rama se llama diferente

echo Backup completado.
exit

