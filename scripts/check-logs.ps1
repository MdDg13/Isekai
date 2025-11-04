# Quick Log Checker Script
# Checks deployment logs after accounting for commit/deployment delay

param(
    [string]$CommitSha = "",
    [int]$WaitForDeployment = 45,  # Wait 45s for deployment (30-40s typical + buffer)
    [int]$CheckInterval = 5  # Check every 5 seconds
)

$ErrorActionPreference = "Continue"

if ([string]::IsNullOrEmpty($CommitSha)) {
    $CommitSha = git rev-parse HEAD
}

Write-Host "=== Log Checker ===" -ForegroundColor Cyan
Write-Host "Monitoring commit: $($CommitSha.Substring(0,7))" -ForegroundColor Yellow
Write-Host "Waiting for deployment (max ${WaitForDeployment}s)..." -ForegroundColor Yellow

$elapsed = 0
$foundLog = $false

while ($elapsed -lt $WaitForDeployment) {
    Start-Sleep -Seconds $CheckInterval
    $elapsed += $CheckInterval
    
    # Pull latest logs
    git pull origin main --quiet 2>&1 | Out-Null
    
    # Check for new logs
    $logs = Get-ChildItem "deployment-logs" -Filter "build-*.log" -ErrorAction SilentlyContinue | 
        Sort-Object LastWriteTime -Descending | 
        Select-Object -First 1
    
    $summaries = Get-ChildItem "deployment-logs" -Filter "summary-*.md" -ErrorAction SilentlyContinue | 
        Sort-Object LastWriteTime -Descending | 
        Select-Object -First 1
    
    if ($summaries) {
        $summaryContent = Get-Content $summaries.FullName -Raw
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
        Write-Host "File: $($logs.Name)" -ForegroundColor Yellow
        Write-Host "Modified: $($logs.LastWriteTime)" -ForegroundColor Gray
        
        $logContent = Get-Content $logs.FullName -Raw
        
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
        Get-Content $logs.FullName -Tail 30
    }
    
    if ($summaries) {
        Write-Host "`n=== DEPLOYMENT SUMMARY ===" -ForegroundColor Cyan
        Get-Content $summaries.FullName
    }
} else {
    Write-Host "`n[WARN] No logs found yet for commit $($CommitSha.Substring(0,7))" -ForegroundColor Yellow
    Write-Host "Deployment may still be in progress or log commit step may have failed" -ForegroundColor Yellow
}

Write-Host "`n=== CHECK COMPLETE ===" -ForegroundColor Cyan

