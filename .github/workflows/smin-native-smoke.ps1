$ErrorActionPreference = "Stop"

$installer = Get-ChildItem "$env:GITHUB_WORKSPACE\artifacts\smin\src-tauri\target\release\bundle\nsis\SMIN-Setup.exe" | Select-Object -First 1
if (-not $installer) { throw "SMIN-Setup.exe was not generated" }

$installDir = Join-Path $env:RUNNER_TEMP "SMIN-installed"
New-Item -ItemType Directory -Force -Path $installDir | Out-Null
Start-Process -FilePath $installer.FullName -ArgumentList "/S", "/D=$installDir" -Wait -PassThru | Out-Null

$exe = Join-Path $installDir "SMIN.exe"
if (-not (Test-Path $exe)) {
  $exe = Get-ChildItem $installDir -Filter "SMIN.exe" -Recurse | Select-Object -First 1 -ExpandProperty FullName
}
if (-not $exe -or -not (Test-Path $exe)) { throw "Installed SMIN.exe was not found" }

$process = Start-Process -FilePath $exe -PassThru
Start-Sleep -Seconds 5
if ($process.HasExited) { throw "SMIN.exe exited during launch smoke test with code $($process.ExitCode)" }
Stop-Process -Id $process.Id -Force
Write-Host "SMIN installation and launch smoke test passed: $exe"
