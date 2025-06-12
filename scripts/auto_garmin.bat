
@echo off

node ../migrationGarmin/run_garmindb_multiple.js


node ../migrationGarmin/migration_all.js
if %errorlevel% neq 0 (
    echo Migration failed with error code %errorlevel%.
    exit /b %errorlevel%
)


