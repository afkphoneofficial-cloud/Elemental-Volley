# Fast-forward origin/live to origin/main and push.
# After 10 Oct 2026 this is the production cut. Run in the Wednesday 05:00-11:00 ICT window.
# Hotfix: .\scripts\promote-live.ps1 -Force
param(
  [switch]$Force
)

$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path (Join-Path $PSScriptRoot ".."))

$liveDay = Get-Date "2026-10-10"
$tz = [TimeZoneInfo]::FindSystemTimeZoneById("SE Asia Standard Time")
$bkk = [TimeZoneInfo]::ConvertTimeFromUtc([DateTime]::UtcNow, $tz)
$mins = $bkk.Hour * 60 + $bkk.Minute
$inWindow = ($bkk.DayOfWeek -eq [DayOfWeek]::Wednesday) -and ($mins -ge 5 * 60) -and ($mins -lt 11 * 60)
$afterLive = $bkk.Date -ge $liveDay.Date

if ($afterLive -and -not $inWindow -and -not $Force) {
  Write-Host "Production promote is for Wednesday 05:00-11:00 ICT. Pass -Force for a hotfix."
  exit 1
}

if (-not $afterLive) {
  Write-Host "Before launch day: keep Vercel Production on main. This still updates the live branch so it is ready on 10 Oct."
}

git fetch origin
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$here = (git rev-parse --abbrev-ref HEAD).Trim()
if ($here -ne "main") {
  git checkout main
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

git pull --ff-only origin main
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

git checkout live
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

git merge --ff-only origin/main
if ($LASTEXITCODE -ne 0) {
  Write-Host "live cannot fast-forward. Merge live into main first, then run this again."
  git checkout main | Out-Null
  exit 1
}

git push origin live
$push = $LASTEXITCODE
git checkout main | Out-Null
if ($push -ne 0) { exit $push }

Write-Host "live is now at the same commit as main."
if ($afterLive) {
  Write-Host "If Vercel Production Branch is live, evolley.dev will pick this up."
}
