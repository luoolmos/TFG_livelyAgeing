
@echo off
python ..\.\GarminDB\scripts\garmindb_cli.py --all --download --import --analyze --latest

.\backup_db.bat

node ../migration_Garmin/migration_hr_series.js
node ../migration_Garmin/migration_rr_series.js
node ../migration_Garmin/migration_spo2.js
node ../migration_Garmin/migration_stress_series.js
node ../migration_Garmin/migration_sleep.js


