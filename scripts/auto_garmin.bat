
@echo off

python ..\.\GarminDB\scripts\garmindb_cli.py --all --download --import --analyze --latest

.\backup_db.bat

node ../migration_Garmin/migration_all.js
if %errorlevel% neq 0 (
    echo Migration failed with error code %errorlevel%.
    exit /b %errorlevel%
)


