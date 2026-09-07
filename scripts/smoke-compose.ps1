$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

Push-Location (Split-Path $PSScriptRoot -Parent)
try {
    if (-not (Test-Path '.env')) { throw 'Create .env from .env.example and replace local placeholders first.' }
    $compose = @('compose', '--env-file', '.env', '-f', 'infra/compose.yml', '-f', 'infra/compose.dev.yml')
    $statusJson = & docker @compose ps --all --format json
    if ($LASTEXITCODE -ne 0) { throw 'Could not read Compose service status.' }
    # Compose versions emit either an array or one JSON object per line.
    $rawStatus = ($statusJson -join "`n").Trim()
    if (-not $rawStatus) { throw 'No Compose containers found.' }
    if ($rawStatus.StartsWith('[')) { $containers = @($rawStatus | ConvertFrom-Json) }
    else { $containers = @($statusJson | ForEach-Object { $_ | ConvertFrom-Json }) }
    $containers | Select-Object Service, State, Health, ExitCode | Format-Table
    $migrator = @($containers | Where-Object { $_.Service -eq 'database-migrator' })
    if ($migrator.Count -ne 1 -or $migrator[0].State -ne 'exited' -or $migrator[0].ExitCode -ne 0) {
        throw 'The database-migrator must have exited successfully.'
    }
    foreach ($port in 8081..8084) {
        $health = Invoke-RestMethod -Uri "http://localhost:$port/actuator/health" -TimeoutSec 10
        if ($health.status -cne 'UP') { throw "Service on port $port is not UP." }
        Write-Host "Service on port $port is UP."
    }
    $logs = & docker @compose logs --no-color database-migrator
    if ($LASTEXITCODE -ne 0) { throw 'Could not read database-migrator logs.' }
    if (($logs -join "`n") -notmatch 'GDS readiness check succeeded\.') { throw 'Migrator logs do not confirm a successful GDS check.' }
    $logs | Write-Host
    $web = Invoke-WebRequest -Uri 'http://localhost:8080/' -UseBasicParsing -TimeoutSec 10
    if ($web.StatusCode -ne 200) { throw 'Web is not reachable.' }
    Write-Host 'Compose runtime smoke passed: four services UP, GDS ready, web reachable.'
}
finally { Pop-Location }
