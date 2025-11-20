# Quick script to check recent generation logs
# Loads env vars from .env.local and queries Supabase

Write-Host "`n=== Recent Generation Logs ===" -ForegroundColor Cyan

# Load environment variables
$envFile = ".env.local"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

$SupabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL
$ServiceRoleKey = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $SupabaseUrl -or -not $ServiceRoleKey) {
    Write-Host "ERROR: Supabase credentials not found in .env.local" -ForegroundColor Red
    Write-Host "Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Yellow
    exit 1
}

$headers = @{
    "apikey" = $ServiceRoleKey
    "Authorization" = "Bearer $ServiceRoleKey"
    "Content-Type" = "application/json"
}

# Get recent config_check logs (diagnostics)
Write-Host "`n📊 Recent Diagnostic Checks:" -ForegroundColor Green
$url = "$SupabaseUrl/rest/v1/generation_log?step=eq.config_check&order=timestamp.desc&limit=5&select=*,generation_request!inner(kind,prompt)"
try {
    $response = Invoke-RestMethod -Uri $url -Method Get -Headers $headers
    
    if ($response.Count -eq 0) {
        Write-Host "  No diagnostic logs found" -ForegroundColor Yellow
    } else {
        foreach ($log in $response) {
            $data = $log.data | ConvertFrom-Json
            $status = if ($data.summary) { "$($data.summary.passed)/$($data.summary.total) passed" } else { "unknown" }
            Write-Host "  $($log.timestamp) - $status" -ForegroundColor $(if ($data.summary.failed -gt 0) { "Red" } else { "Green" })
            if ($data.failedChecks) {
                Write-Host "    Failed: $($data.failedChecks -join ', ')" -ForegroundColor Red
            }
        }
    }
} catch {
    Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

# Get recent portrait generation logs
Write-Host "`n🖼️  Recent Portrait Generation:" -ForegroundColor Green
$url = "$SupabaseUrl/rest/v1/generation_log?step=eq.portrait_generation&order=timestamp.desc&limit=5&select=*"
try {
    $response = Invoke-RestMethod -Uri $url -Method Get -Headers $headers
    
    if ($response.Count -eq 0) {
        Write-Host "  No portrait generation logs found" -ForegroundColor Yellow
    } else {
        foreach ($log in $response) {
            $icon = if ($log.log_type -eq 'error') { "❌" } elseif ($log.log_type -eq 'warning') { "⚠️" } else { "✅" }
            Write-Host "  $icon $($log.timestamp) - $($log.message)" -ForegroundColor $(if ($log.log_type -eq 'error') { "Red" } elseif ($log.log_type -eq 'warning') { "Yellow" } else { "Green" })
        }
    }
} catch {
    Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n💡 For detailed analysis, run: npx tsx scripts/database/analyze-generation-logs.ts" -ForegroundColor Cyan

