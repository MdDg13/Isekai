# Execute Schema Enhancement Migration
# 
# This script provides instructions and can help verify the migration
# 
# Usage:
#   .\scripts\database\execute-migration.ps1

param(
    [switch]$DryRun,
    [switch]$Verify
)

$ErrorActionPreference = "Stop"

Write-Host "📋 Schema Enhancement Migration" -ForegroundColor Cyan
Write-Host ""

if ($DryRun) {
    Write-Host "📝 DRY RUN MODE" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Migration SQL location: docs\db\migrations\2025-11-schema-enhancement.sql" -ForegroundColor Green
    Write-Host ""
    Write-Host "To execute the migration:" -ForegroundColor Yellow
    Write-Host "1. Open Supabase Dashboard: https://supabase.com/dashboard/project/xblkaezmfdhchndhkjsv" -ForegroundColor White
    Write-Host "2. Navigate to SQL Editor" -ForegroundColor White
    Write-Host "3. Copy contents of docs\db\migrations\2025-11-schema-enhancement.sql" -ForegroundColor White
    Write-Host "4. Paste and execute" -ForegroundColor White
    Write-Host "5. Run this script with -Verify to check results" -ForegroundColor White
    Write-Host ""
    
    # Show first few lines of migration
    $migrationPath = Join-Path $PSScriptRoot "..\..\docs\db\migrations\2025-11-schema-enhancement.sql"
    if (Test-Path $migrationPath) {
        Write-Host "Preview of migration SQL:" -ForegroundColor Cyan
        Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor Gray
        Get-Content $migrationPath -Head 20
        Write-Host "... (see full file for complete SQL)" -ForegroundColor Gray
        Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor Gray
    }
    
    exit 0
}

if ($Verify) {
    Write-Host "🔍 Verifying migration..." -ForegroundColor Cyan
    Write-Host ""
    
    # Check if we can connect to Supabase
    $supabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL
    $supabaseKey = $env:SUPABASE_SERVICE_ROLE_KEY
    
    if (-not $supabaseUrl -or -not $supabaseKey) {
        Write-Host "❌ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Environment variables configured" -ForegroundColor Green
    Write-Host ""
    Write-Host "To verify migration, run:" -ForegroundColor Yellow
    Write-Host "  npx ts-node scripts/database/test-schema-enhancement.ts" -ForegroundColor White
    Write-Host ""
    Write-Host "Or check manually in Supabase SQL Editor:" -ForegroundColor Yellow
    Write-Host @"
-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'world_element' 
ORDER BY indexname;

-- Check functions  
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE 'validate_%';

-- Check views
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name LIKE '%_with_%';
"@ -ForegroundColor White
    
    exit 0
}

# Default: show help
Write-Host "Usage:" -ForegroundColor Yellow
Write-Host "  .\scripts\database\execute-migration.ps1 -DryRun    # Show instructions" -ForegroundColor White
Write-Host "  .\scripts\database\execute-migration.ps1 -Verify    # Verify migration" -ForegroundColor White
Write-Host ""

