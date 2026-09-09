$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Assert-Contract([bool] $Condition, [string] $Message) {
    if (-not $Condition) { throw $Message }
}

$repositoryRoot = Split-Path $PSScriptRoot -Parent
$migrationRoot = Join-Path $repositoryRoot 'database/migrations'
$expected = [ordered]@{
    'V001__core_node_constraints.cypher' = @(
        'user_id_unique',
        'user_normalized_email_unique',
        'movie_id_unique',
        'genre_id_unique',
        'genre_normalized_name_unique'
    )
    'V002__relationship_uniqueness.cypher' = @(
        'rated_key_unique',
        'watchlisted_key_unique'
    )
    'V003__search_indexes.cypher' = @(
        'movie_title_index',
        'movie_release_year_index',
        'genre_name_index'
    )
    'V004__auth_support_constraints.cypher' = @(
        'auth_session_id_unique',
        'auth_challenge_id_unique'
    )
    'V005__share_constraints.cypher' = @(
        'recommendation_share_id_unique',
        'recommendation_share_token_hash_unique'
    )
}

Assert-Contract (Test-Path -LiteralPath $migrationRoot -PathType Container) 'Migration directory is missing.'
$actualFiles = @(Get-ChildItem -LiteralPath $migrationRoot -File -Filter 'V*.cypher' | Sort-Object Name)
Assert-Contract ($actualFiles.Count -eq $expected.Count) 'Migration file count differs from the canonical baseline.'
Assert-Contract ((@($actualFiles.Name) -join ',') -ceq (@($expected.Keys) -join ',')) 'Migration versions or names differ from the canonical baseline.'

foreach ($file in $actualFiles) {
    $content = Get-Content -Raw -LiteralPath $file.FullName
    Assert-Contract ($content -notmatch '(?i)\bapoc\.') "$($file.Name) must not require APOC."
    foreach ($schemaName in $expected[$file.Name]) {
        Assert-Contract (([regex]::Matches($content, "(?m)\b$([regex]::Escape($schemaName))\b")).Count -eq 1) "$($file.Name) must define $schemaName exactly once."
    }
}

$allContent = ($actualFiles | ForEach-Object { Get-Content -Raw -LiteralPath $_.FullName }) -join "`n"
$allSchemaNames = @($expected.Values | ForEach-Object { $_ })
foreach ($schemaName in $allSchemaNames) {
    Assert-Contract (([regex]::Matches($allContent, "(?m)\b$([regex]::Escape($schemaName))\b")).Count -eq 1) "Schema name $schemaName must be globally unique."
}

$businessMigrations = @(Get-ChildItem -LiteralPath (Join-Path $repositoryRoot 'backend') -Recurse -File -Filter 'V*.cypher')
Assert-Contract ($businessMigrations.Count -eq 0) 'Business services must not own schema migrations.'
Write-Host "Migration contract passed: $($expected.Count) versions, $($allSchemaNames.Count) named schema objects."
