# Merge all enhanced data files for upload to Supabase

param(
    [string]$InputDir = "data/free5e/processed"
)

Write-Host "`n=== Merging Enhanced Data Files ===" -ForegroundColor Cyan
Write-Host "Input directory: $InputDir`n" -ForegroundColor Gray

# Merge items (enhanced takes precedence)
$itemsMerged = @()
$itemsFile = Join-Path $InputDir "items-merged.json"
$itemsEnhancedFile = Join-Path $InputDir "items-enhanced.json"

if (Test-Path $itemsFile) {
    $itemsMerged = Get-Content $itemsFile -Raw | ConvertFrom-Json
    Write-Host "Loaded $($itemsMerged.Count) items from merged file" -ForegroundColor Gray
}

if (Test-Path $itemsEnhancedFile) {
    $itemsEnhanced = Get-Content $itemsEnhancedFile -Raw | ConvertFrom-Json
    Write-Host "Loaded $($itemsEnhanced.Count) items from enhanced file" -ForegroundColor Gray
    
    # Merge: enhanced items override merged items by name+source
    $existingKeys = @{}
    foreach ($item in $itemsMerged) {
        $key = "$($item.name)::$($item.source)"
        $existingKeys[$key] = $true
    }
    
    foreach ($item in $itemsEnhanced) {
        $key = "$($item.name)::$($item.source)"
        if (-not $existingKeys.ContainsKey($key)) {
            $itemsMerged += $item
        }
    }
}

$itemsMerged | ConvertTo-Json -Depth 10 | Set-Content (Join-Path $InputDir "items-final.json")
Write-Host "Saved $($itemsMerged.Count) items to items-final.json" -ForegroundColor Green

# Merge monsters (enhanced takes precedence)
$monstersMerged = @()
$monstersFile = Join-Path $InputDir "monsters-merged.json"
$monstersEnhancedFile = Join-Path $InputDir "monsters-enhanced.json"

if (Test-Path $monstersFile) {
    $monstersMerged = Get-Content $monstersFile -Raw | ConvertFrom-Json
    Write-Host "Loaded $($monstersMerged.Count) monsters from merged file" -ForegroundColor Gray
}

if (Test-Path $monstersEnhancedFile) {
    $monstersEnhanced = Get-Content $monstersEnhancedFile -Raw | ConvertFrom-Json
    Write-Host "Loaded $($monstersEnhanced.Count) monsters from enhanced file" -ForegroundColor Gray
    
    $existingKeys = @{}
    foreach ($monster in $monstersMerged) {
        $key = "$($monster.name)::$($monster.source)"
        $existingKeys[$key] = $true
    }
    
    foreach ($monster in $monstersEnhanced) {
        $key = "$($monster.name)::$($monster.source)"
        if (-not $existingKeys.ContainsKey($key)) {
            $monstersMerged += $monster
        }
    }
}

$monstersMerged | ConvertTo-Json -Depth 10 | Set-Content (Join-Path $InputDir "monsters-final.json")
Write-Host "Saved $($monstersMerged.Count) monsters to monsters-final.json" -ForegroundColor Green

# Spells (already updated)
$spellsFile = Join-Path $InputDir "spells-merged.json"
if (Test-Path $spellsFile) {
    $spells = Get-Content $spellsFile -Raw | ConvertFrom-Json
    $spells | ConvertTo-Json -Depth 10 | Set-Content (Join-Path $InputDir "spells-final.json")
    Write-Host "Saved $($spells.Count) spells to spells-final.json" -ForegroundColor Green
}

# Classes, subclasses, races, feats (from enhanced extraction)
$classesFile = Join-Path $InputDir "classes-extracted.json"
$subclassesFile = Join-Path $InputDir "subclasses-extracted.json"
$racesFile = Join-Path $InputDir "races-extracted.json"
$featsFile = Join-Path $InputDir "feats-extracted.json"

if (Test-Path $classesFile) {
    $classes = Get-Content $classesFile -Raw | ConvertFrom-Json
    $classes | ConvertTo-Json -Depth 10 | Set-Content (Join-Path $InputDir "classes-final.json")
    Write-Host "Saved $($classes.Count) classes to classes-final.json" -ForegroundColor Green
}

if (Test-Path $subclassesFile) {
    $subclasses = Get-Content $subclassesFile -Raw | ConvertFrom-Json
    $subclasses | ConvertTo-Json -Depth 10 | Set-Content (Join-Path $InputDir "subclasses-final.json")
    Write-Host "Saved $($subclasses.Count) subclasses to subclasses-final.json" -ForegroundColor Green
}

if (Test-Path $racesFile) {
    $races = Get-Content $racesFile -Raw | ConvertFrom-Json
    $races | ConvertTo-Json -Depth 10 | Set-Content (Join-Path $InputDir "races-final.json")
    Write-Host "Saved $($races.Count) races to races-final.json" -ForegroundColor Green
}

if (Test-Path $featsFile) {
    $feats = Get-Content $featsFile -Raw | ConvertFrom-Json
    $feats | ConvertTo-Json -Depth 10 | Set-Content (Join-Path $InputDir "feats-final.json")
    Write-Host "Saved $($feats.Count) feats to feats-final.json" -ForegroundColor Green
}

Write-Host "`n=== Merge Complete ===`n" -ForegroundColor Cyan

