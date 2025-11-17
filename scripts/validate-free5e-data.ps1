# Free5e Data Validation Script
# Validates processed Free5e data for completeness, consistency, and rule compliance

param(
    [string]$InputDir = "data/free5e/processed",
    [string]$ReportFile = "docs/free5e-validation-report.md"
)

Write-Host "`n=== Free5e Data Validation ===" -ForegroundColor Cyan
Write-Host "Input directory: $InputDir`n" -ForegroundColor Gray

if (-not (Test-Path $InputDir)) {
    Write-Host "ERROR: Input directory does not exist: $InputDir" -ForegroundColor Red
    exit 1
}

# Validation statistics
$ValidationStats = @{
    Items = @{ Total = 0; Valid = 0; Invalid = 0; Warnings = 0 }
    Spells = @{ Total = 0; Valid = 0; Invalid = 0; Warnings = 0 }
    Monsters = @{ Total = 0; Valid = 0; Invalid = 0; Warnings = 0 }
    Classes = @{ Total = 0; Valid = 0; Invalid = 0; Warnings = 0 }
    Races = @{ Total = 0; Valid = 0; Invalid = 0; Warnings = 0 }
    Backgrounds = @{ Total = 0; Valid = 0; Invalid = 0; Warnings = 0 }
    Feats = @{ Total = 0; Valid = 0; Invalid = 0; Warnings = 0 }
}

$ValidationErrors = @()
$ValidationWarnings = @()

# Validate items
$ItemsFile = Join-Path $InputDir "items.json"
if (Test-Path $ItemsFile) {
    Write-Host "Validating items..." -ForegroundColor Yellow
    try {
        $items = Get-Content -Path $ItemsFile -Raw | ConvertFrom-Json
        
        foreach ($item in $items) {
            $ValidationStats.Items.Total++
            
            # Basic validation
            $errors = @()
            $warnings = @()
            
            if (-not $item.name) { $errors += "Missing name" }
            if (-not $item.kind) { $errors += "Missing kind" }
            if (-not $item.description) { $errors += "Missing description" }
            
            if ($item.cost_gp -and $item.cost_gp -lt 0) {
                $errors += "Invalid cost_gp: $($item.cost_gp)"
            }
            
            if ($item.weight_lb -and $item.weight_lb -lt 0) {
                $errors += "Invalid weight_lb: $($item.weight_lb)"
            }
            
            if ($item.kind -eq "magic_item" -and -not $item.rarity) {
                $warnings += "Magic item missing rarity"
            }
            
            if ($errors.Count -eq 0) {
                $ValidationStats.Items.Valid++
            } else {
                $ValidationStats.Items.Invalid++
                $ValidationErrors += "Item '$($item.name)': $($errors -join ', ')"
            }
            
            if ($warnings.Count -gt 0) {
                $ValidationStats.Items.Warnings++
                $ValidationWarnings += "Item '$($item.name)': $($warnings -join ', ')"
            }
        }
        
        Write-Host "  Processed $($ValidationStats.Items.Total) items" -ForegroundColor Gray
        Write-Host "  Valid: $($ValidationStats.Items.Valid), Invalid: $($ValidationStats.Items.Invalid), Warnings: $($ValidationStats.Items.Warnings)" -ForegroundColor $(if ($ValidationStats.Items.Invalid -eq 0) { "Green" } else { "Red" })
    }
    catch {
        Write-Host "  ERROR: Failed to validate items" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Validate spells
$SpellsFile = Join-Path $InputDir "spells.json"
if (Test-Path $SpellsFile) {
    Write-Host "Validating spells..." -ForegroundColor Yellow
    try {
        $spells = Get-Content -Path $SpellsFile -Raw | ConvertFrom-Json
        
        foreach ($spell in $spells) {
            $ValidationStats.Spells.Total++
            
            $errors = @()
            $warnings = @()
            
            if (-not $spell.name) { $errors += "Missing name" }
            if ($spell.level -eq $null -or $spell.level -lt 0 -or $spell.level -gt 9) {
                $errors += "Invalid level: $($spell.level)"
            }
            if (-not $spell.school) { $errors += "Missing school" }
            if (-not $spell.casting_time) { $errors += "Missing casting_time" }
            if (-not $spell.range) { $errors += "Missing range" }
            if (-not $spell.components) { $errors += "Missing components" }
            if (-not $spell.duration) { $errors += "Missing duration" }
            if (-not $spell.description) { $errors += "Missing description" }
            
            $validSchools = @("abjuration", "conjuration", "divination", "enchantment", "evocation", "illusion", "necromancy", "transmutation")
            if ($spell.school -and $validSchools -notcontains $spell.school.ToLower()) {
                $errors += "Invalid school: $($spell.school)"
            }
            
            if ($spell.duration -and $spell.duration -match "concentration" -and -not $spell.concentration) {
                $warnings += "Duration mentions concentration but flag not set"
            }
            
            if ($errors.Count -eq 0) {
                $ValidationStats.Spells.Valid++
            } else {
                $ValidationStats.Spells.Invalid++
                $ValidationErrors += "Spell '$($spell.name)': $($errors -join ', ')"
            }
            
            if ($warnings.Count -gt 0) {
                $ValidationStats.Spells.Warnings++
                $ValidationWarnings += "Spell '$($spell.name)': $($warnings -join ', ')"
            }
        }
        
        Write-Host "  Processed $($ValidationStats.Spells.Total) spells" -ForegroundColor Gray
        Write-Host "  Valid: $($ValidationStats.Spells.Valid), Invalid: $($ValidationStats.Spells.Invalid), Warnings: $($ValidationStats.Spells.Warnings)" -ForegroundColor $(if ($ValidationStats.Spells.Invalid -eq 0) { "Green" } else { "Red" })
    }
    catch {
        Write-Host "  ERROR: Failed to validate spells" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Validate monsters
$MonstersFile = Join-Path $InputDir "monsters.json"
if (Test-Path $MonstersFile) {
    Write-Host "Validating monsters..." -ForegroundColor Yellow
    try {
        $monsters = Get-Content -Path $MonstersFile -Raw | ConvertFrom-Json
        
        foreach ($monster in $monsters) {
            $ValidationStats.Monsters.Total++
            
            $errors = @()
            $warnings = @()
            
            if (-not $monster.name) { $errors += "Missing name" }
            if (-not $monster.size) { $errors += "Missing size" }
            if (-not $monster.type) { $errors += "Missing type" }
            if (-not $monster.alignment) { $errors += "Missing alignment" }
            if (-not $monster.armor_class) { $errors += "Missing armor_class" }
            if (-not $monster.hit_points) { $errors += "Missing hit_points" }
            if (-not $monster.hit_dice) { $errors += "Missing hit_dice" }
            if (-not $monster.speed) { $errors += "Missing speed" }
            if (-not $monster.stats) { $errors += "Missing stats" }
            if ($monster.challenge_rating -eq $null) { $errors += "Missing challenge_rating" }
            
            $validSizes = @("Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan")
            if ($monster.size -and $validSizes -notcontains $monster.size) {
                $errors += "Invalid size: $($monster.size)"
            }
            
            if ($monster.stats) {
                $requiredStats = @("str", "dex", "con", "int", "wis", "cha")
                foreach ($stat in $requiredStats) {
                    if (-not $monster.stats.$stat) {
                        $errors += "Missing stat: $stat"
                    } elseif ($monster.stats.$stat -lt 1 -or $monster.stats.$stat -gt 30) {
                        $warnings += "Stat $stat outside normal range: $($monster.stats.$stat)"
                    }
                }
            }
            
            if ($errors.Count -eq 0) {
                $ValidationStats.Monsters.Valid++
            } else {
                $ValidationStats.Monsters.Invalid++
                $ValidationErrors += "Monster '$($monster.name)': $($errors -join ', ')"
            }
            
            if ($warnings.Count -gt 0) {
                $ValidationStats.Monsters.Warnings++
                $ValidationWarnings += "Monster '$($monster.name)': $($warnings -join ', ')"
            }
        }
        
        Write-Host "  Processed $($ValidationStats.Monsters.Total) monsters" -ForegroundColor Gray
        Write-Host "  Valid: $($ValidationStats.Monsters.Valid), Invalid: $($ValidationStats.Monsters.Invalid), Warnings: $($ValidationStats.Monsters.Warnings)" -ForegroundColor $(if ($ValidationStats.Monsters.Invalid -eq 0) { "Green" } else { "Red" })
    }
    catch {
        Write-Host "  ERROR: Failed to validate monsters" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Generate validation report
$ReportDir = Split-Path -Path $ReportFile -Parent
if (-not (Test-Path $ReportDir)) {
    New-Item -ItemType Directory -Path $ReportDir -Force | Out-Null
}

$Report = @"
# Free5e Data Validation Report

Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

## Summary

| Content Type | Total | Valid | Invalid | Warnings |
|--------------|-------|-------|---------|----------|
| Items | $($ValidationStats.Items.Total) | $($ValidationStats.Items.Valid) | $($ValidationStats.Items.Invalid) | $($ValidationStats.Items.Warnings) |
| Spells | $($ValidationStats.Spells.Total) | $($ValidationStats.Spells.Valid) | $($ValidationStats.Spells.Invalid) | $($ValidationStats.Spells.Warnings) |
| Monsters | $($ValidationStats.Monsters.Total) | $($ValidationStats.Monsters.Valid) | $($ValidationStats.Monsters.Invalid) | $($ValidationStats.Monsters.Warnings) |
| Classes | $($ValidationStats.Classes.Total) | $($ValidationStats.Classes.Valid) | $($ValidationStats.Classes.Invalid) | $($ValidationStats.Classes.Warnings) |
| Races | $($ValidationStats.Races.Total) | $($ValidationStats.Races.Valid) | $($ValidationStats.Races.Invalid) | $($ValidationStats.Races.Warnings) |
| Backgrounds | $($ValidationStats.Backgrounds.Total) | $($ValidationStats.Backgrounds.Valid) | $($ValidationStats.Backgrounds.Invalid) | $($ValidationStats.Backgrounds.Warnings) |
| Feats | $($ValidationStats.Feats.Total) | $($ValidationStats.Feats.Valid) | $($ValidationStats.Feats.Invalid) | $($ValidationStats.Feats.Warnings) |

## Errors

$($ValidationErrors.Count) error(s) found:

$(if ($ValidationErrors.Count -gt 0) {
    $ValidationErrors | ForEach-Object { "- $_" } | Out-String
} else {
    "No errors found."
})

## Warnings

$($ValidationWarnings.Count) warning(s) found:

$(if ($ValidationWarnings.Count -gt 0) {
    $ValidationWarnings | ForEach-Object { "- $_" } | Out-String
} else {
    "No warnings found."
})

## Recommendations

$(if ($ValidationErrors.Count -gt 0) {
    "- Fix all errors before proceeding to database population"
    "- Review data sources for missing or incorrect information"
} else {
    "- All data passed validation"
    "- Proceed to database population"
})

$(if ($ValidationWarnings.Count -gt 0) {
    "- Review warnings and address as needed"
    "- Some warnings may be acceptable depending on context"
})
"@

$Report | Out-File -FilePath $ReportFile -Encoding UTF8

Write-Host "`n=== Validation Complete ===" -ForegroundColor Cyan
Write-Host "Report saved to: $ReportFile" -ForegroundColor Green

$TotalErrors = ($ValidationStats.Items.Invalid + $ValidationStats.Spells.Invalid + $ValidationStats.Monsters.Invalid + 
               $ValidationStats.Classes.Invalid + $ValidationStats.Races.Invalid + 
               $ValidationStats.Backgrounds.Invalid + $ValidationStats.Feats.Invalid)

if ($TotalErrors -eq 0) {
    Write-Host "`nAll data passed validation! Proceed to database population." -ForegroundColor Green
} else {
    Write-Host "`n$TotalErrors error(s) found. Please fix errors before proceeding." -ForegroundColor Red
}

