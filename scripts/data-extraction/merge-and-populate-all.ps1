# Merge and Populate All Content
# Merges parsed content from multiple sources and populates Supabase

param(
    [string]$ProcessedDir = "data/free5e/processed",
    [int]$BatchSize = 100,
    [switch]$DryRun = $false
)

Write-Host ""
Write-Host "=== Merge and Populate All Content ===" -ForegroundColor Cyan
Write-Host "Processed directory: $ProcessedDir" -ForegroundColor Gray
Write-Host ""

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
    Write-Host "ERROR: Supabase credentials not found" -ForegroundColor Red
    exit 1
}

# Find all JSON files
$spellFiles = @(
    "$ProcessedDir/spells.json",
    "$ProcessedDir/spells-additional.json"
)

$itemFiles = @(
    "$ProcessedDir/items.json",
    "$ProcessedDir/items-additional.json"
)

$monsterFiles = @(
    "$ProcessedDir/monsters.json",
    "$ProcessedDir/monsters-additional.json"
)

# Merge spells
$allSpells = @()
foreach ($file in $spellFiles) {
    if (Test-Path $file) {
        Write-Host "Loading: $file" -ForegroundColor Gray
        $spells = Get-Content -Path $file -Raw | ConvertFrom-Json
        $allSpells += $spells
    }
}

# Merge items
$allItems = @()
foreach ($file in $itemFiles) {
    if (Test-Path $file) {
        Write-Host "Loading: $file" -ForegroundColor Gray
        $items = Get-Content -Path $file -Raw | ConvertFrom-Json
        $allItems += $items
    }
}

# Merge monsters
$allMonsters = @()
foreach ($file in $monsterFiles) {
    if (Test-Path $file) {
        Write-Host "Loading: $file" -ForegroundColor Gray
        $monsters = Get-Content -Path $file -Raw | ConvertFrom-Json
        $allMonsters += $monsters
    }
}

Write-Host ""
Write-Host "Total content to merge:" -ForegroundColor Cyan
Write-Host "  Spells: $($allSpells.Count)" -ForegroundColor Gray
Write-Host "  Items: $($allItems.Count)" -ForegroundColor Gray
Write-Host "  Monsters: $($allMonsters.Count)" -ForegroundColor Gray

# Remove duplicates (by name)
Write-Host ""
Write-Host "Removing duplicates..." -ForegroundColor Yellow
$uniqueSpells = $allSpells | Sort-Object -Property name -Unique
$uniqueItems = $allItems | Sort-Object -Property name -Unique
$uniqueMonsters = $allMonsters | Sort-Object -Property name -Unique

Write-Host "  Unique spells: $($uniqueSpells.Count)" -ForegroundColor Gray
Write-Host "  Unique items: $($uniqueItems.Count)" -ForegroundColor Gray
Write-Host "  Unique monsters: $($uniqueMonsters.Count)" -ForegroundColor Gray

# Save merged files
$mergedSpellsFile = "$ProcessedDir/spells-merged.json"
$mergedItemsFile = "$ProcessedDir/items-merged.json"
$mergedMonstersFile = "$ProcessedDir/monsters-merged.json"

$uniqueSpells | ConvertTo-Json -Depth 10 | Out-File -FilePath $mergedSpellsFile -Encoding UTF8
$uniqueItems | ConvertTo-Json -Depth 10 | Out-File -FilePath $mergedItemsFile -Encoding UTF8
$uniqueMonsters | ConvertTo-Json -Depth 10 | Out-File -FilePath $mergedMonstersFile -Encoding UTF8

Write-Host ""
Write-Host "Merged files saved" -ForegroundColor Green

# Summary
Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "Ready to populate:" -ForegroundColor Green
Write-Host "  Spells: $($uniqueSpells.Count)" -ForegroundColor Gray
Write-Host "  Items: $($uniqueItems.Count)" -ForegroundColor Gray
Write-Host "  Monsters: $($uniqueMonsters.Count)" -ForegroundColor Gray
Write-Host "Next step: Run populate-reference-tables.ps1" -ForegroundColor Yellow
