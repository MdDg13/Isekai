# Merge all PDF-extracted data with existing data

param(
    [string]$InputDir = "data/free5e/processed"
)

Write-Host "`n=== Merging All PDF Data ===" -ForegroundColor Cyan
Write-Host "Input directory: $InputDir`n" -ForegroundColor Gray

# Merge spells
$spellsMerged = @()
$spellsFile = Join-Path $InputDir "spells-merged.json"
$spellsPdfFile = Join-Path $InputDir "spells-pdf-extracted.json"

if (Test-Path $spellsFile) {
    $spellsMerged = Get-Content $spellsFile -Raw | ConvertFrom-Json
    Write-Host "Loaded $($spellsMerged.Count) spells from merged file" -ForegroundColor Gray
}

if (Test-Path $spellsPdfFile) {
    $spellsPdf = Get-Content $spellsPdfFile -Raw | ConvertFrom-Json
    Write-Host "Loaded $($spellsPdf.Count) spells from PDF extraction" -ForegroundColor Gray
    
    # Merge: PDF spells override merged spells by name+source
    $existingKeys = @{}
    foreach ($spell in $spellsMerged) {
        $key = "$($spell.name)::$($spell.source)"
        $existingKeys[$key] = $true
    }
    
    foreach ($spell in $spellsPdf) {
        $key = "$($spell.name)::$($spell.source)"
        if (-not $existingKeys.ContainsKey($key)) {
            $spellsMerged += $spell
        }
    }
}

$spellsMerged | ConvertTo-Json -Depth 10 | Set-Content (Join-Path $InputDir "spells-final.json")
Write-Host "Saved $($spellsMerged.Count) spells to spells-final.json" -ForegroundColor Green

# Merge monsters
$monstersMerged = @()
$monstersFile = Join-Path $InputDir "monsters-merged.json"
$monstersPdfFile = Join-Path $InputDir "monsters-pdf-extracted.json"

if (Test-Path $monstersFile) {
    $monstersMerged = Get-Content $monstersFile -Raw | ConvertFrom-Json
    Write-Host "Loaded $($monstersMerged.Count) monsters from merged file" -ForegroundColor Gray
}

if (Test-Path $monstersPdfFile) {
    $monstersPdf = Get-Content $monstersPdfFile -Raw | ConvertFrom-Json
    Write-Host "Loaded $($monstersPdf.Count) monsters from PDF extraction" -ForegroundColor Gray
    
    $existingKeys = @{}
    foreach ($monster in $monstersMerged) {
        $key = "$($monster.name)::$($monster.source)"
        $existingKeys[$key] = $true
    }
    
    foreach ($monster in $monstersPdf) {
        $key = "$($monster.name)::$($monster.source)"
        if (-not $existingKeys.ContainsKey($key)) {
            $monstersMerged += $monster
        }
    }
}

$monstersMerged | ConvertTo-Json -Depth 10 | Set-Content (Join-Path $InputDir "monsters-final.json")
Write-Host "Saved $($monstersMerged.Count) monsters to monsters-final.json" -ForegroundColor Green

# Merge items
$itemsMerged = @()
$itemsFile = Join-Path $InputDir "items-merged.json"
$itemsPdfFile = Join-Path $InputDir "items-pdf-extracted.json"

if (Test-Path $itemsFile) {
    $itemsMergedList = Get-Content $itemsFile -Raw | ConvertFrom-Json
    if ($itemsMergedList) {
        $itemsMerged = @($itemsMergedList)
        Write-Host "Loaded $($itemsMerged.Count) items from merged file" -ForegroundColor Gray
    } else {
        $itemsMerged = @()
    }
} else {
    $itemsMerged = @()
}

if (Test-Path $itemsPdfFile) {
    $itemsPdfList = Get-Content $itemsPdfFile -Raw | ConvertFrom-Json
    if ($itemsPdfList) {
        $itemsPdf = @($itemsPdfList)
        Write-Host "Loaded $($itemsPdf.Count) items from PDF extraction" -ForegroundColor Gray
        
        $existingKeys = @{}
        foreach ($item in $itemsMerged) {
            if ($item.name -and $item.source) {
                $key = "$($item.name)::$($item.source)"
                $existingKeys[$key] = $true
            }
        }
        
        foreach ($item in $itemsPdf) {
            if ($item.name -and $item.source) {
                $key = "$($item.name)::$($item.source)"
                if (-not $existingKeys.ContainsKey($key)) {
                    $itemsMerged += $item
                }
            }
        }
    }
}

$itemsMerged | ConvertTo-Json -Depth 10 | Set-Content (Join-Path $InputDir "items-final.json")
Write-Host "Saved $($itemsMerged.Count) items to items-final.json" -ForegroundColor Green

# Merge feats
$featsMerged = @()
$featsFile = Join-Path $InputDir "feats-extracted.json"
$featsPdfFile = Join-Path $InputDir "feats-pdf-extracted.json"

if (Test-Path $featsFile) {
    $featsMerged = Get-Content $featsFile -Raw | ConvertFrom-Json
    Write-Host "Loaded $($featsMerged.Count) feats from extracted file" -ForegroundColor Gray
}

if (Test-Path $featsPdfFile) {
    $featsPdf = Get-Content $featsPdfFile -Raw | ConvertFrom-Json
    Write-Host "Loaded $($featsPdf.Count) feats from PDF extraction" -ForegroundColor Gray
    
    $existingKeys = @{}
    foreach ($feat in $featsMerged) {
        $key = "$($feat.name)::$($feat.source)"
        $existingKeys[$key] = $true
    }
    
    foreach ($feat in $featsPdf) {
        $key = "$($feat.name)::$($feat.source)"
        if (-not $existingKeys.ContainsKey($key)) {
            $featsMerged += $feat
        }
    }
}

$featsMerged | ConvertTo-Json -Depth 10 | Set-Content (Join-Path $InputDir "feats-final.json")
Write-Host "Saved $($featsMerged.Count) feats to feats-final.json" -ForegroundColor Green

Write-Host "`n=== Merge Complete ===`n" -ForegroundColor Cyan
Write-Host "Final counts:" -ForegroundColor Yellow
Write-Host "  Spells: $($spellsMerged.Count)" -ForegroundColor White
Write-Host "  Monsters: $($monstersMerged.Count)" -ForegroundColor White
Write-Host "  Items: $($itemsMerged.Count)" -ForegroundColor White
Write-Host "  Feats: $($featsMerged.Count)" -ForegroundColor White

# Merge classes
$classesMerged = @()
$classesFile = Join-Path $InputDir "classes-extracted.json"
$classesPdfFile = Join-Path $InputDir "classes-pdf-extracted.json"

if (Test-Path $classesFile) {
    $classesMerged = Get-Content $classesFile -Raw | ConvertFrom-Json
    Write-Host "Loaded $($classesMerged.Count) classes from extracted file" -ForegroundColor Gray
}

if (Test-Path $classesPdfFile) {
    $classesPdf = Get-Content $classesPdfFile -Raw | ConvertFrom-Json
    Write-Host "Loaded $($classesPdf.Count) classes from PDF extraction" -ForegroundColor Gray
    
    $existingKeys = @{}
    foreach ($class in $classesMerged) {
        if ($class.name -and $class.source) {
            $key = "$($class.name)::$($class.source)"
            $existingKeys[$key] = $true
        }
    }
    
    foreach ($class in $classesPdf) {
        if ($class.name -and $class.source) {
            $key = "$($class.name)::$($class.source)"
            if (-not $existingKeys.ContainsKey($key)) {
                $classesMerged += $class
            }
        }
    }
}

$classesMerged | ConvertTo-Json -Depth 10 | Set-Content (Join-Path $InputDir "classes-final.json")
Write-Host "Saved $($classesMerged.Count) classes to classes-final.json" -ForegroundColor Green

# Merge races
$racesMerged = @()
$racesFile = Join-Path $InputDir "races-extracted.json"
$racesPdfFile = Join-Path $InputDir "races-pdf-extracted.json"

if (Test-Path $racesFile) {
    $racesMerged = Get-Content $racesFile -Raw | ConvertFrom-Json
    Write-Host "Loaded $($racesMerged.Count) races from extracted file" -ForegroundColor Gray
}

if (Test-Path $racesPdfFile) {
    $racesPdf = Get-Content $racesPdfFile -Raw | ConvertFrom-Json
    Write-Host "Loaded $($racesPdf.Count) races from PDF extraction" -ForegroundColor Gray
    
    $existingKeys = @{}
    foreach ($race in $racesMerged) {
        if ($race.name -and $race.source) {
            $key = "$($race.name)::$($race.source)"
            $existingKeys[$key] = $true
        }
    }
    
    foreach ($race in $racesPdf) {
        if ($race.name -and $race.source) {
            $key = "$($race.name)::$($race.source)"
            if (-not $existingKeys.ContainsKey($key)) {
                $racesMerged += $race
            }
        }
    }
}

$racesMerged | ConvertTo-Json -Depth 10 | Set-Content (Join-Path $InputDir "races-final.json")
Write-Host "Saved $($racesMerged.Count) races to races-final.json" -ForegroundColor Green

Write-Host "`n=== Merge Complete ===`n" -ForegroundColor Cyan
Write-Host "Final counts:" -ForegroundColor Yellow
Write-Host "  Spells: $($spellsMerged.Count)" -ForegroundColor White
Write-Host "  Monsters: $($monstersMerged.Count)" -ForegroundColor White
Write-Host "  Items: $($itemsMerged.Count)" -ForegroundColor White
Write-Host "  Feats: $($featsMerged.Count)" -ForegroundColor White
Write-Host "  Classes: $($classesMerged.Count)" -ForegroundColor White
Write-Host "  Races: $($racesMerged.Count)" -ForegroundColor White

# Merge subclasses
$subclassesMerged = @()
$subclassesFile = Join-Path $InputDir "subclasses-extracted.json"
$subclassesPdfFile = Join-Path $InputDir "subclasses-pdf-extracted.json"

if (Test-Path $subclassesFile) {
    $subclassesMerged = Get-Content $subclassesFile -Raw | ConvertFrom-Json
    Write-Host "Loaded $($subclassesMerged.Count) subclasses from extracted file" -ForegroundColor Gray
}

if (Test-Path $subclassesPdfFile) {
    $subclassesPdf = Get-Content $subclassesPdfFile -Raw | ConvertFrom-Json
    Write-Host "Loaded $($subclassesPdf.Count) subclasses from PDF extraction" -ForegroundColor Gray
    
    $existingKeys = @{}
    foreach ($subclass in $subclassesMerged) {
        if ($subclass.name -and $subclass.source) {
            $key = "$($subclass.name)::$($subclass.source)"
            $existingKeys[$key] = $true
        }
    }
    
    foreach ($subclass in $subclassesPdf) {
        if ($subclass.name -and $subclass.source) {
            $key = "$($subclass.name)::$($subclass.source)"
            if (-not $existingKeys.ContainsKey($key)) {
                $subclassesMerged += $subclass
            }
        }
    }
}

$subclassesMerged | ConvertTo-Json -Depth 10 | Set-Content (Join-Path $InputDir "subclasses-final.json")
Write-Host "Saved $($subclassesMerged.Count) subclasses to subclasses-final.json" -ForegroundColor Green

Write-Host "`n=== Final Merge Summary ===`n" -ForegroundColor Cyan
Write-Host "Final counts:" -ForegroundColor Yellow
Write-Host "  Spells: $($spellsMerged.Count)" -ForegroundColor White
Write-Host "  Monsters: $($monstersMerged.Count)" -ForegroundColor White
Write-Host "  Items: $($itemsMerged.Count)" -ForegroundColor White
Write-Host "  Feats: $($featsMerged.Count)" -ForegroundColor White
Write-Host "  Classes: $($classesMerged.Count)" -ForegroundColor White
Write-Host "  Subclasses: $($subclassesMerged.Count)" -ForegroundColor White
Write-Host "  Races: $($racesMerged.Count)" -ForegroundColor White

