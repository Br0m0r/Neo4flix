$repositoryRoot = (Resolve-Path "$PSScriptRoot/..").Path
$javaHome = Get-ChildItem 'C:\Program Files\Java' -Directory |
    Where-Object { Test-Path (Join-Path $_.FullName 'bin\java.exe') } |
    Select-Object -First 1 -ExpandProperty FullName
if (-not $javaHome) { throw 'A host JDK is required for the wrapper mirror proof.' }
$previousJavaHome = $env:JAVA_HOME
$previousMavenUserHome = $env:MAVEN_USER_HOME
$previousRepoUrl = $env:MVNW_REPOURL

try {
    $env:JAVA_HOME = $javaHome
    $env:MAVEN_USER_HOME = Join-Path $env:TEMP ('neo4flix-wrapper-mirror-' + [guid]::NewGuid().ToString())
    $env:MVNW_REPOURL = 'https://repo.maven.apache.org/maven2'
    & "$repositoryRoot/mvnw.cmd" -version
    if ($LASTEXITCODE -ne 0) { throw 'Wrapper failed normal Maven mirror startup.' }
} finally {
    $env:JAVA_HOME = $previousJavaHome
    $env:MAVEN_USER_HOME = $previousMavenUserHome
    $env:MVNW_REPOURL = $previousRepoUrl
}
