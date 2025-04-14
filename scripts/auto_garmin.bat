
@echo off
python ..\.\GarminDB\scripts\garmindb_cli.py --all --download --import --analyze --latest

.\backup_db.bat

