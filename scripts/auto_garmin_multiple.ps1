<#
.SYNOPSIS
    Ejecuta garmindb_cli.py para múltiples cuentas Garmin con distintas credenciales.
.DESCRIPTION
    Para cada carpeta de configuración (que contenga .GarminDb/GarminConnectConfig.json), establece HOME, ejecuta el CLI y renombra la salida .db.
.PARAMETER Configs
    Array de rutas absolutas a directorios que contengan la configuración Garmin (HOME).
.PARAMETER OutputNames
    Array de nombres de fichero (sin extensión) para renombrar la base de datos resultante.
.EXAMPLE
    .\auto_garmin_multiple.ps1 \
      -Configs "C:\configs\garmin1","C:\configs\garmin2" \
      -OutputNames "account1","account2"
#>
param(
    [Parameter(Mandatory=$true)]
    [string[]]$Configs,
    [Parameter(Mandatory=$true)]
    [string[]]$OutputNames
)
if ($Configs.Length -ne $OutputNames.Length) {
    Write-Error "Configs y OutputNames deben tener la misma longitud."
    exit 1
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$pythonScript = Join-Path $scriptDir "..\GarminDB\scripts\garmindb_cli.py"

for ($i = 0; $i -lt $Configs.Length; $i++) {
    $config = $Configs[$i]
    $name = $OutputNames[$i]
    Write-Host "\nProcesando cuenta: $name (config en $config)"

    # Establecer HOME para que GarminConnectConfigManager lea la configuración correcta
    $env:HOME = $config

    # Ejecutar el CLI Garmin
    python "$pythonScript" --all --download --import --analyze --latest

    # Mover y renombrar la base de datos SQLite resultante
    $dbDir = Join-Path $config "HealthData\DBs"
    $dbFile = Get-ChildItem -Path $dbDir -Filter "*.db" | Select-Object -First 1
    if ($dbFile) {
        $dest = Join-Path $dbDir ($name + ".db")
        Move-Item -Path $dbFile.FullName -Destination $dest -Force
        Write-Host "Base de datos renombrada: $($dbFile.Name) -> $($name).db"
    } else {
        Write-Warning "No se encontró ningún .db en $dbDir"
    }
}

# Restaurar HOME original
Remove-Item Env:\HOME -ErrorAction SilentlyContinue
Write-Host "\nProceso completo."
