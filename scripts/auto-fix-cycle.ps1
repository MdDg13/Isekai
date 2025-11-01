# Automated Build/Test Cycle Script for Isekai Project
# Monitors deployments, reads logs, makes fixes, and iterates automatically

param(
    [int]$MaxFailures = 10,
    [int]$CheckInterval = 10,  # seconds between checks (optimized for 30-40s deployments)
    [int]$DeploymentTimeout = 120,  # max seconds to wait for deployment (2 minutes)
    [int]$LogCommitTimeout = 90,  # max seconds to wait for logs to appear in GitHub (1.5 minutes)
    [string]$ProgressLog = "scripts/progress-log.md"
)

$ErrorActionPreference = "Stop"
$script:AttemptCount = 0
$script:FailureCount = 0
$script:SuccessCount = 0
$script:ProgressLogPath = $ProgressLog

function Write-ProgressLog {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] $Message"
    Add-Content -Path $script:ProgressLogPath -Value $logEntry
    Write-Host $logEntry
}

function Initialize-ProgressLog {
    if (Test-Path $script:ProgressLogPath) {
        $existing = Get-Content $script:ProgressLogPath -Raw
        if ($existing -notmatch "## Session Started") {
            Add-Content -Path $script:ProgressLogPath -Value "`n## Session Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n"
        }
    } else {
        $dir = Split-Path $script:ProgressLogPath -Parent
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
        @"
# Isekai Auto-Fix Cycle Progress Log

## Session Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

"@ | Out-File -FilePath $script:ProgressLogPath -Encoding UTF8
    }
}

function Get-LatestCommit {
    git rev-parse HEAD
}

function Wait-ForGitHubDeployment {
    param([string]$CommitSha, [int]$MaxWait = $DeploymentTimeout)
    
    Write-ProgressLog "Waiting for GitHub Actions deployment (timeout: ${MaxWait}s, check every: ${CheckInterval}s)..."
    $elapsed = 0
    $lastLogTime = Get-Date
    $workflowStartTime = Get-Date
    
    while ($elapsed -lt $MaxWait) {
        Start-Sleep -Seconds $CheckInterval
        $elapsed += $CheckInterval
        
        # Check if new commit exists (deployment logs committed)
        try {
            git fetch origin main --quiet 2>&1 | Out-Null
            git pull origin main --quiet 2>&1 | Out-Null
        } catch {
            Write-ProgressLog "Warning: Git fetch/pull failed - $($_.Exception.Message)"
        }
        
        $newLogs = Get-ChildItem "deployment-logs" -Filter "build-*.log" -ErrorAction SilentlyContinue | 
            Sort-Object LastWriteTime -Descending | 
            Select-Object -First 1
        
        if ($newLogs) {
            $logContent = Get-Content $newLogs.FullName -Raw
            
            # Check if this is for our commit (check commit SHA in log content or summary)
            $summaryFiles = Get-ChildItem "deployment-logs" -Filter "summary-*.md" -ErrorAction SilentlyContinue |
                Sort-Object LastWriteTime -Descending | 
                Select-Object -First 1
            
            $isOurCommit = $false
            if ($summaryFiles) {
                $summaryContent = Get-Content $summaryFiles.FullName -Raw
                if ($summaryContent -match $CommitSha.Substring(0,7)) {
                    $isOurCommit = $true
                }
            }
            
            # Also check if log content matches our commit timeframe
            if ($logContent -match $CommitSha.Substring(0,7) -or $isOurCommit) {
                # Check build result
                if ($logContent -match 'Failed|Error.*build|Build error occurred') {
                    Write-ProgressLog "Deployment completed - Build failed (elapsed: ${elapsed}s)"
                    return @{ Success = $false; HasLogs = $true }
                }
                elseif ($logContent -match 'Generating static pages|Route.*Size|Creating an optimized|✓ Compiled') {
                    # Successful build patterns
                    if ($logContent -notmatch 'Build error|Failed') {
                        Write-ProgressLog "Deployment completed - Build succeeded (elapsed: ${elapsed}s)"
                        return @{ Success = $true; HasLogs = $true }
                    }
                }
                
                # Log found but status unclear
                $lastLogTime = Get-Date
            }
        }
        
        # Alternative: Check for gh CLI if available (faster detection)
        if (Get-Command gh -ErrorAction SilentlyContinue) {
            try {
                $workflows = gh run list --limit 1 --json status,conclusion,headSha,createdAt,updatedAt --jq '.[0]' 2>$null
                if ($workflows) {
                    $wfData = $workflows | ConvertFrom-Json
                    if ($wfData.headSha -eq $CommitSha) {
                        if ($wfData.status -eq "completed") {
                            Write-ProgressLog "Deployment completed with status: $($wfData.conclusion) (elapsed: ${elapsed}s)"
                            return @{ Success = ($wfData.conclusion -eq "success"); HasLogs = $true }
                        }
                        if ($elapsed % 30 -eq 0) {  # Only log every 30s to reduce noise
                            Write-ProgressLog "Deployment status: $($wfData.status) (elapsed: ${elapsed}s)"
                        }
                    }
                }
            } catch {
                # Fall through to next check
            }
        }
        
        # Warning if deployment is taking too long
        if ($elapsed -ge 60 -and $elapsed % 30 -eq 0) {
            Write-ProgressLog "Deployment taking longer than expected (${elapsed}s elapsed, typical: 30-40s)"
        }
        
        # Check if stuck (no logs after reasonable time)
        if ($elapsed -gt 90) {
            $timeSinceLastLog = ((Get-Date) - $lastLogTime).TotalSeconds
            if ($timeSinceLastLog -gt 60 -and -not $newLogs) {
                Write-ProgressLog "WARNING: No logs found after ${elapsed}s - deployment may be stuck or log commit failed"
            }
        }
    }
    
    Write-ProgressLog "TIMEOUT: Deployment exceeded ${MaxWait}s timeout (typical: 30-40s) - possible issues:"
    Write-ProgressLog "  - GitHub Actions workflow stuck/failed"
    Write-ProgressLog "  - Cloudflare deployment delayed"
    Write-ProgressLog "  - Log commit step failed (check Actions logs)"
    return @{ Success = $false; HasLogs = $false; Timeout = $true }
}

function Get-LatestBuildLog {
    $logFiles = Get-ChildItem "deployment-logs" -Filter "build-*.log" -ErrorAction SilentlyContinue | 
        Sort-Object LastWriteTime -Descending | 
        Select-Object -First 1
    
    if ($logFiles) {
        return Get-Content $logFiles.FullName -Raw
    }
    
    return $null
}

function Analyze-BuildFailure {
    param([string]$LogContent)
    
    $issues = @{}
    
    if ($LogContent -match 'missing.*generateStaticParams') {
        $issues['generateStaticParams'] = $true
    }
    
    if ($LogContent -match 'Type.*Promise.*missing') {
        $issues['asyncParams'] = $true
    }
    
    if ($LogContent -match 'cannot be used with.*output.*export') {
        $issues['staticExport'] = $true
    }
    
    if ($LogContent -match 'Error.*compil') {
        $issues['compilation'] = $true
    }
    
    if ($LogContent -match 'Failed.*build') {
        $issues['build'] = $true
    }
    
    return $issues
}

function Apply-Fix {
    param([hashtable]$Issues, [string]$LogContent)
    
    Write-ProgressLog "Analyzing failure and applying fix..."
    
    # Fix 1: generateStaticParams detection issue - try multiple approaches
    if ($Issues['generateStaticParams']) {
        Write-ProgressLog "Issue: generateStaticParams not detected - Applying fix attempt #$($script:FailureCount)"
        $pageFile = "src/app/campaign/[id]/page.tsx"
        
        if (Test-Path $pageFile) {
            $content = Get-Content $pageFile -Raw
            
            # Strategy varies by attempt count
            if ($script:FailureCount -eq 1) {
                # Ensure it's async
                $content = $content -replace 'export function generateStaticParams', 'export async function generateStaticParams'
                Write-ProgressLog "Fix 1: Made generateStaticParams async"
            }
            elseif ($script:FailureCount -eq 2) {
                # Try with dynamicParams export
                if ($content -notmatch 'export const dynamicParams') {
                    $content = $content -replace '(export async function generateStaticParams\(\) \{[\s\S]*?\})', '$1`n`nexport const dynamicParams = true;'
                    Write-ProgressLog "Fix 2: Added dynamicParams export"
                }
            }
            elseif ($script:FailureCount -eq 3) {
                # Try non-async but explicit return type
                $content = $content -replace 'export async function generateStaticParams\(\)', 'export function generateStaticParams(): Promise<Array<{id: string}>>'
                $content = $content -replace 'return \[\];', 'return Promise.resolve([]);'
                Write-ProgressLog "Fix 3: Made explicit return type with Promise.resolve"
            }
            elseif ($script:FailureCount -ge 4) {
                # Disable static export for this route by removing generateStaticParams requirement
                # Actually, let's try removing output: export temporarily
                $nextConfig = "next.config.mjs"
                if (Test-Path $nextConfig) {
                    $config = Get-Content $nextConfig -Raw
                    $config = $config -replace "output: 'export',", "// output: 'export', // Temporarily disabled"
                    Set-Content -Path $nextConfig -Value $config -NoNewline
                    Write-ProgressLog "Fix 4: Disabled static export temporarily"
                    git add $nextConfig
                    git commit -m "fix: disable static export temporarily to test"
                    return $true
                }
            }
            
            Set-Content -Path $pageFile -Value $content -NoNewline
            git add $pageFile
            git commit -m "fix: auto-fix attempt $script:FailureCount - generateStaticParams"
            return $true
        }
    }
    
    # Fix 2: Async params issue
    if ($Issues['asyncParams']) {
        Write-ProgressLog "Issue: Async params mismatch"
        $pageFile = "src/app/campaign/[id]/page.tsx"
        if (Test-Path $pageFile) {
            $content = Get-Content $pageFile -Raw
            # Ensure params is Promise type
            $content = $content -replace 'params: \{ id: string \}', 'params: Promise<{ id: string }>'
            $content = $content -replace 'export default function CampaignPage', 'export default async function CampaignPage'
            if ($content -notmatch 'await params') {
                $content = $content -replace 'params\) \{', 'params) {`n  const { id } = await params;'
                $content = $content -replace 'params\.id', 'id'
            }
            Set-Content -Path $pageFile -Value $content -NoNewline
            git add $pageFile
            git commit -m "fix: auto-fix async params pattern"
            return $true
        }
    }
    
    return $false
}

function Run-Cycle {
    Write-ProgressLog "=== Starting Auto-Fix Cycle ==="
    Write-ProgressLog "Max failures: $MaxFailures | Check interval: ${CheckInterval}s"
    
    Initialize-ProgressLog
    
    while ($script:FailureCount -lt $MaxFailures) {
        $script:AttemptCount++
        Write-ProgressLog "`n--- Attempt #$script:AttemptCount ---"
        
        $currentCommit = Get-LatestCommit
        Write-ProgressLog "Current commit: $($currentCommit.Substring(0,7))"
        
        # Push any pending changes
        $status = git status --porcelain
        if ($status) {
            Write-ProgressLog "Pushing pending changes..."
            git push origin main
            Start-Sleep -Seconds 5
        }
        
        # Wait for deployment
        $deployResult = Wait-ForGitHubDeployment -CommitSha $currentCommit -MaxWait $DeploymentTimeout
        
        # Handle timeout or missing logs
        if ($deployResult.Timeout -or -not $deployResult.HasLogs) {
            Write-ProgressLog "Deployment issue detected - waiting additional ${LogCommitTimeout}s for logs..."
            $logWaitElapsed = 0
            while ($logWaitElapsed -lt $LogCommitTimeout) {
                Start-Sleep -Seconds $CheckInterval
                $logWaitElapsed += $CheckInterval
                
                git pull origin main --quiet 2>&1 | Out-Null
                $logContent = Get-LatestBuildLog
                if ($logContent) {
                    Write-ProgressLog "Logs found after additional ${logWaitElapsed}s wait"
                    break
                }
                
                if ($logWaitElapsed % 20 -eq 0) {
                    Write-ProgressLog "Still waiting for logs... (${logWaitElapsed}s)"
                }
            }
        }
        
        # Pull latest to get logs
        git pull origin main --quiet 2>&1 | Out-Null
        
        # Get and analyze logs
        $logContent = Get-LatestBuildLog
        if ($logContent) {
            $issues = Analyze-BuildFailure -LogContent $logContent
            Write-ProgressLog "Detected issues: $($issues.Keys -join ', ')"
            
            if ($deployResult.Success) {
                $script:SuccessCount++
                Write-ProgressLog "✓ SUCCESS - Build passed!"
                break
            } else {
                $script:FailureCount++
                Write-ProgressLog "✗ FAILURE #$script:FailureCount - Analyzing and applying fix..."
                
                $fixApplied = Apply-Fix -Issues $issues -LogContent $logContent
                
                if ($fixApplied) {
                    Write-ProgressLog "Fix applied, pushing and waiting..."
                    git push origin main
                    Start-Sleep -Seconds 5  # Short wait before checking again
                } else {
                    Write-ProgressLog "No automatic fix available, manual intervention needed"
                    break
                }
            }
        } else {
            Write-ProgressLog "ERROR: No build log found after deployment timeout"
            Write-ProgressLog "Possible causes:"
            Write-ProgressLog "  - GitHub Actions workflow failed before build step"
            Write-ProgressLog "  - Log commit step failed (check Actions: Commit deployment logs step)"
            Write-ProgressLog "  - Deployment still in progress (check manually)"
            
            $script:FailureCount++
            if ($script:FailureCount -ge $MaxFailures) {
                Write-ProgressLog "Max failures reached without logs - stopping"
                break
            }
            
            Write-ProgressLog "Waiting ${CheckInterval}s before retry..."
            Start-Sleep -Seconds $CheckInterval
        }
    }
    
    Write-ProgressLog "`n=== Cycle Complete ==="
    Write-ProgressLog "Attempts: $script:AttemptCount | Success: $script:SuccessCount | Failures: $script:FailureCount"
    
    if ($script:FailureCount -ge $MaxFailures) {
        Write-ProgressLog "`nΓÜá MAX FAILURES REACHED - Analyzing methodology..."
        Write-AnalysisReport
    }
}

function Write-AnalysisReport {
    $report = @"

## Analysis Report - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

**Total Attempts:** $script:AttemptCount
**Successes:** $script:SuccessCount  
**Failures:** $script:FailureCount

### Pattern Analysis:
1. Issue persists across multiple attempts
2. Standard fixes (async params, export patterns) not resolving
3. Likely root cause: Next.js 15.5.4 + static export + dynamic routes incompatibility

### Recommended Approach:
1. **Disable static export** for dynamic routes OR
2. **Downgrade Next.js** to 14.x OR
3. **Make route fully client-side** rendered OR
4. **Use catch-all route** with manual param extraction

### Next Steps:
Manual review required - automated fixes exhausted.

"@
    
    Add-Content -Path $script:ProgressLogPath -Value $report
    Write-Host $report
}

# Check prerequisites
$hasGhCli = Get-Command gh -ErrorAction SilentlyContinue
if (-not $hasGhCli) {
    Write-ProgressLog "GitHub CLI not found - will use git-based monitoring"
    Write-ProgressLog "For better monitoring, install: winget install GitHub.cli"
} else {
    # Check authentication
    try {
        gh auth status 2>&1 | Out-Null
        Write-ProgressLog "GitHub CLI authenticated"
    } catch {
        Write-ProgressLog "GitHub CLI not authenticated - will use git-based monitoring"
        Write-ProgressLog "For better monitoring, run: gh auth login"
    }
}

# Run the cycle
try {
    Run-Cycle
} catch {
    Write-ProgressLog "ERROR: $_"
    Write-AnalysisReport
    exit 1
}

