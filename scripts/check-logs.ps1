# Quick Log Checker Script
# Checks deployment logs after accounting for commit/deployment delay

param(
    [string]$CommitSha = "",
    [int]$WaitForDeployment = 45,  # Wait 45s for deployment (30-40s typical + buffer)
    [int]$CheckInterval = 5,  # Check every 5 seconds
    [string]$LogsBranch = "origin/deployment-logs"  # Git ref where CI pushes logs
)

$ErrorActionPreference = "Continue"

if ([string]::IsNullOrEmpty($CommitSha)) {
    $CommitSha = git rev-parse HEAD
}

Write-Host "=== Log Checker (Actions-only) ===" -ForegroundColor Cyan
Write-Host "Monitoring commit: $($CommitSha.Substring(0,7))" -ForegroundColor Yellow
Write-Host "Waiting for deployment (max ${WaitForDeployment}s)..." -ForegroundColor Yellow

$elapsed = 0
$foundLog = $false

while ($elapsed -lt $WaitForDeployment) {
    Start-Sleep -Seconds $CheckInterval
    $elapsed += $CheckInterval
    
    # Fetch logs branch without switching branches
    git fetch origin deployment-logs --quiet 2>&1 | Out-Null

    # List files in logs branch
    $logNames = (& git ls-tree -r --name-only $LogsBranch -- deployment-logs/ 2>&1)
    if ($LASTEXITCODE -ne 0) { $logNames = @() }
    $buildFiles = $logNames | Where-Object { $_ -like "deployment-logs/build-*.log" }
    $summaryFiles = $logNames | Where-Object { $_ -like "deployment-logs/summary-*.md" }

    # Choose latest by lexical sort (files are timestamped or per-commit)
    $buildPath = ($buildFiles | Sort-Object | Select-Object -Last 1)
    $summaryPath = ($summaryFiles | Sort-Object | Select-Object -Last 1)
    $logs = $null
    $summaries = $null
    if ($buildPath) { $logs = $buildPath }
    if ($summaryPath) { $summaries = $summaryPath }
    
    if ($summaries) {
        $summaryContent = (& git show "${LogsBranch}:$summaries" 2>$null)
        if ($summaryContent -match $CommitSha.Substring(0,7)) {
            $foundLog = $true
            $msg = "Logs found for commit $($CommitSha.Substring(0,7)) (" + $elapsed + "s elapsed)"
            Write-Host "`n[OK] $msg" -ForegroundColor Green
            break
        }
    }
    
    if ($elapsed % 10 -eq 0) {
        Write-Host ("Checking... (" + $elapsed + "s elapsed)") -ForegroundColor Gray
    }
}

if ($foundLog -or $logs) {
    Write-Host "`n=== LATEST BUILD LOG ===" -ForegroundColor Cyan
    if ($logs) {
        Write-Host "File: $($logs)" -ForegroundColor Yellow
        
        $logContent = (& git show "${LogsBranch}:$logs" 2>$null)
        
        # Check build result
        if ($logContent -match 'Build error occurred|Failed|Error.*build') {
            Write-Host "`n[FAIL] BUILD FAILED" -ForegroundColor Red
            Write-Host "`n=== ERROR DETAILS ===" -ForegroundColor Red
            $logContent | Select-String -Pattern "Error|Failed|Build error" -Context 2,5 | ForEach-Object { Write-Host $_.Line }
        }
        elseif ($logContent -match 'Generating static pages|Route.*Size|Creating an optimized') {
            if ($logContent -notmatch 'Build error|Failed') {
                Write-Host "`n[OK] BUILD SUCCEEDED" -ForegroundColor Green
            }
        }
        
        Write-Host "`n=== LAST 30 LINES ===" -ForegroundColor Cyan
        ($logContent -split "`n" | Select-Object -Last 30) -join "`n"
    }
    
    if ($summaries) {
        Write-Host "`n=== DEPLOYMENT SUMMARY ===" -ForegroundColor Cyan
        (& git show "${LogsBranch}:$summaries" 2>$null)
    }

    # Try to show Wrangler deploy log if present
    $wrangler = (& git ls-tree -r --name-only $LogsBranch -- deployment-logs/ 2>$null) | Where-Object { $_ -like "deployment-logs/wrangler-deploy-*.log" } | Sort-Object | Select-Object -Last 1
    if ($wrangler) {
        Write-Host "`n=== WRANGLER DEPLOY LOG (tail) ===" -ForegroundColor Cyan
        $wcontent = (& git show "${LogsBranch}:$wrangler" 2>$null)
        ($wcontent -split "`n" | Select-Object -Last 40) -join "`n"
    }
} else {
    Write-Host "`n[WARN] No logs found yet for commit $($CommitSha.Substring(0,7))" -ForegroundColor Yellow
    Write-Host "Deployment may still be in progress or log commit step may have failed" -ForegroundColor Yellow
}

Write-Host "`n=== CHECK COMPLETE ===" -ForegroundColor Cyan

