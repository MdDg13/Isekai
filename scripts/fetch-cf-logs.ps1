param(
  [string]$Project = "isekai-f2i",
  [int]$Tail = 200
)

$ErrorActionPreference = "Stop"

if (-not $env:CLOUDFLARE_API_TOKEN) { Write-Error "CLOUDFLARE_API_TOKEN not set" }
if (-not $env:CLOUDFLARE_ACCOUNT_ID) { Write-Error "CLOUDFLARE_ACCOUNT_ID not set" }

Write-Host "Fetching latest deployment for project '$Project'..." -ForegroundColor Cyan
$deploy = Invoke-RestMethod -Method Get -Uri "https://api.cloudflare.com/client/v4/accounts/$($env:CLOUDFLARE_ACCOUNT_ID)/pages/projects/$Project/deployments" -Headers @{ Authorization = "Bearer $($env:CLOUDFLARE_API_TOKEN)" }

if (-not $deploy.success) { $deploy | ConvertTo-Json -Depth 6; exit 1 }

$latest = $deploy.result | Select-Object -First 1
if (-not $latest) { Write-Error "No deployments found" }

Write-Host ("Deployment: {0}  env={1}  source={2}  created={3}" -f $latest.id,$latest.environment,$latest.source,$latest.created_on) -ForegroundColor Yellow

Write-Host "\nBuild logs:" -ForegroundColor Cyan
$logs = Invoke-RestMethod -Method Get -Uri "https://api.cloudflare.com/client/v4/accounts/$($env:CLOUDFLARE_ACCOUNT_ID)/pages/projects/$Project/deployments/$($latest.id)/history/logs" -Headers @{ Authorization = "Bearer $($env:CLOUDFLARE_API_TOKEN)" }

if ($logs) {
  ($logs | Out-String).Trim().Split("`n") | Select-Object -Last $Tail | ForEach-Object { Write-Host $_ }
} else {
  Write-Host "No logs returned" -ForegroundColor Yellow
}


