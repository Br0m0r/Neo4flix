$wrapper = Get-Content -Raw "$PSScriptRoot/../mvnw.cmd"
$expectedConditional = '$MVNW_REPO_PATTERN = if ($USE_MVND -eq $False) { "/org/apache/maven/" } else { "/maven/mvnd/" }'

if (-not $wrapper.Contains($expectedConditional)) {
    throw 'Wrapper must select /org/apache/maven/ for Maven and /maven/mvnd/ for mvnd under MVNW_REPOURL.'
}

function Get-RepositoryPath([bool]$useMvnd) {
    if ($useMvnd -eq $False) { return '/org/apache/maven/' }
    return '/maven/mvnd/'
}

if ((Get-RepositoryPath $false) -ne '/org/apache/maven/') {
    throw 'Normal Maven mirror path is incorrect.'
}

if ((Get-RepositoryPath $true) -ne '/maven/mvnd/') {
    throw 'mvnd mirror path is incorrect.'
}
