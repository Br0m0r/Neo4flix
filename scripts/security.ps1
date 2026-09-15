param(
    [switch] $WhatIf
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$repository = Split-Path $PSScriptRoot -Parent

function Show-Step([string] $Description) {
    Write-Output "[security] $Description"
}

function Invoke-Checked([string] $Directory, [string] $Command, [string[]] $Arguments) {
    $description = "$Command $($Arguments -join ' ')"
    Show-Step $description
    if ($WhatIf) { return }

    Push-Location (Join-Path $repository $Directory)
    try {
        $native = if ($env:OS -eq 'Windows_NT' -and $Command -eq 'npm') { 'npm.cmd' } else { $Command }
        & $native @Arguments
        if ($LASTEXITCODE -ne 0) { throw "$description failed with exit code $LASTEXITCODE." }
    }
    finally { Pop-Location }
}

Show-Step 'tracked secret-path review'
$tracked = @(& git -C $repository ls-files)
if ($LASTEXITCODE -ne 0) { throw 'Could not enumerate tracked files.' }
$secretPaths = @($tracked | Where-Object {
    $_ -match '(^|/)(\.env(\..*)?|[^/]+\.(pem|key|p12|pfx))$' -and $_ -notmatch '(^|/)\.env\.example$'
})
if ($secretPaths.Count -gt 0) {
    throw "Tracked secret-shaped paths found: $($secretPaths -join ', ')"
}

Invoke-Checked '.' 'npm' @('audit', '--prefix', 'frontend', '--audit-level', 'high')

if (Get-Command gitleaks -ErrorAction SilentlyContinue) {
    Invoke-Checked '.' 'gitleaks' @('detect', '--source', $repository, '--no-banner', '--redact', '--exit-code', '1')
}
else {
    Show-Step 'gitleaks detect [SKIP: gitleaks is not installed]'
}

if (Get-Command trivy -ErrorAction SilentlyContinue) {
    Invoke-Checked '.' 'trivy' @('fs', '--scanners', 'vuln,secret,misconfig', '--severity', 'HIGH,CRITICAL', '--exit-code', '1', $repository)
}
else {
    Show-Step 'trivy fs [SKIP: trivy is not installed]'
}

Write-Output 'Security scan entry point completed.'
