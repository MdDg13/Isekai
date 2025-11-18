# Check Schema Enhancement Migration Status
# Verifies if migration has been run by checking views and table structure

$ErrorActionPreference = "Stop"

$supabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL
$supabaseKey = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $supabaseUrl -or -not $supabaseKey) {
    Write-Host "ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set" -ForegroundColor Red
    exit 1
}

Write-Host "Checking Migration Status" -ForegroundColor Cyan
Write-Host ""

# Check if views exist
Write-Host "Checking views..." -ForegroundColor Yellow

$views = @('npc_with_location', 'location_with_npc_count')
$viewResults = @()

foreach ($view in $views) {
    try {
        $headers = @{
            'apikey' = $supabaseKey
            'Authorization' = "Bearer $supabaseKey"
            'Content-Type' = 'application/json'
        }
        
        $uri = "$supabaseUrl/rest/v1/$view" + '?select=*&limit=1'
        $response = Invoke-RestMethod -Uri $uri -Method Get -Headers $headers -ErrorAction Stop
        Write-Host "  OK: View '$view' exists and is accessible" -ForegroundColor Green
        $viewResults += @{ Name = $view; Status = "OK" }
    } catch {
        Write-Host "  FAILED: View '$view' not found: $($_.Exception.Message)" -ForegroundColor Red
        $viewResults += @{ Name = $view; Status = "FAILED" }
    }
}

Write-Host ""
Write-Host "Checking world_element table..." -ForegroundColor Yellow

try {
    $headers = @{
        'apikey' = $supabaseKey
        'Authorization' = "Bearer $supabaseKey"
        'Content-Type' = 'application/json'
    }
    
    $uri = "$supabaseUrl/rest/v1/world_element" + '?select=id,type,name&limit=1'
    $response = Invoke-RestMethod -Uri $uri -Method Get -Headers $headers -ErrorAction Stop
    Write-Host "  OK: world_element table exists" -ForegroundColor Green
    $tableExists = $true
} catch {
    Write-Host "  FAILED: world_element table not found: $($_.Exception.Message)" -ForegroundColor Red
    $tableExists = $false
}

Write-Host ""

# Summary
$allViewsOK = ($viewResults | Where-Object { $_.Status -eq "OK" }).Count -eq $views.Count

if ($allViewsOK -and $tableExists) {
    Write-Host "Migration appears to be complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "To fully verify, run these queries in Supabase SQL Editor:" -ForegroundColor Yellow
    Write-Host "SELECT indexname FROM pg_indexes WHERE tablename = 'world_element' ORDER BY indexname;" -ForegroundColor White
    Write-Host "SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name LIKE 'validate_%';" -ForegroundColor White
} else {
    Write-Host "Migration may not have been run yet" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To run the migration:" -ForegroundColor Yellow
    Write-Host "  1. Open Supabase Dashboard -> SQL Editor" -ForegroundColor White
    Write-Host "  2. Copy contents of docs\db\migrations\2025-11-schema-enhancement.sql" -ForegroundColor White
    Write-Host "  3. Paste and execute" -ForegroundColor White
    Write-Host "  4. Run this script again to verify" -ForegroundColor White
}
