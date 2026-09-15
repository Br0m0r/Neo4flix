[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$Destination,

    [string]$ContainerName = 'neo4flix-neo4j-1'
)

$ErrorActionPreference = 'Stop'

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'Docker CLI is required.'
}

$destinationPath = [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $Destination))
New-Item -ItemType Directory -Path $destinationPath -Force | Out-Null

$running = & docker inspect --format '{{.State.Running}}' $ContainerName 2>$null
if ($LASTEXITCODE -ne 0 -or $running.Trim() -ne 'true') {
    throw "Container '$ContainerName' is not running. Start the intended container before backing it up."
}

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$dumpName = "neo4j-$stamp.dump"
$containerTemp = '/tmp/neo4flix-backup'
$containerDump = "$containerTemp/neo4j.dump"

& docker exec $ContainerName sh -c "rm -rf $containerTemp && mkdir -p $containerTemp" | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Could not prepare the container backup directory.' }

& docker exec $ContainerName neo4j-admin database dump neo4j --to-path=$containerTemp --overwrite-destination | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'neo4j-admin database dump failed.' }

$target = Join-Path $destinationPath $dumpName
& docker cp "${ContainerName}:$containerDump" $target | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Could not copy the Neo4j dump to the requested destination.' }

Write-Output "Neo4j dump written to $target"
