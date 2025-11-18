# Free5e Data Processing Script
# Processes raw Free5e data into structured JSON for database insertion

param(
    [string]$InputDir = "data/free5e/raw",
    [string]$OutputDir = "data/free5e/processed",
    [string]$Format = "JSON"  # JSON, CSV, or PDF
)

# Create output directory if it doesn't exist
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
    Write-Host "Created directory: $OutputDir" -ForegroundColor Green
}

Write-Host "`n=== Free5e Data Processing ===" -ForegroundColor Cyan
Write-Host "Input directory: $InputDir" -ForegroundColor Gray
Write-Host "Output directory: $OutputDir" -ForegroundColor Gray
Write-Host "Format: $Format`n" -ForegroundColor Gray

# Processing statistics
$Stats = @{
    Items = 0
    Spells = 0
    Monsters = 0
    Classes = 0
    Races = 0
    Backgrounds = 0
    Feats = 0
    Errors = 0
}

# Process JSON files (if available)
$JsonFiles = Get-ChildItem -Path $InputDir -Filter "*.json" -ErrorAction SilentlyContinue
if ($JsonFiles) {
    Write-Host "Processing JSON files..." -ForegroundColor Yellow
    
    foreach ($file in $JsonFiles) {
        Write-Host "  Processing: $($file.Name)" -ForegroundColor Gray
        
        try {
            $jsonData = Get-Content -Path $file.FullName -Raw | ConvertFrom-Json
            
            # Process based on file name pattern
            if ($file.Name -match "items?") {
                $processed = Process-Items -Data $jsonData
                $Stats.Items += $processed.Count
                $processed | ConvertTo-Json -Depth 10 | Out-File -FilePath (Join-Path $OutputDir "items.json") -Encoding UTF8
                Write-Host "    Processed $($processed.Count) items" -ForegroundColor Green
            }
            elseif ($file.Name -match "spells?") {
                $processed = Process-Spells -Data $jsonData
                $Stats.Spells += $processed.Count
                $processed | ConvertTo-Json -Depth 10 | Out-File -FilePath (Join-Path $OutputDir "spells.json") -Encoding UTF8
                Write-Host "    Processed $($processed.Count) spells" -ForegroundColor Green
            }
            elseif ($file.Name -match "monsters?") {
                $processed = Process-Monsters -Data $jsonData
                $Stats.Monsters += $processed.Count
                $processed | ConvertTo-Json -Depth 10 | Out-File -FilePath (Join-Path $OutputDir "monsters.json") -Encoding UTF8
                Write-Host "    Processed $($processed.Count) monsters" -ForegroundColor Green
            }
            elseif ($file.Name -match "classes?") {
                $processed = Process-Classes -Data $jsonData
                $Stats.Classes += $processed.Count
                $processed | ConvertTo-Json -Depth 10 | Out-File -FilePath (Join-Path $OutputDir "classes.json") -Encoding UTF8
                Write-Host "    Processed $($processed.Count) classes" -ForegroundColor Green
            }
            elseif ($file.Name -match "races?") {
                $processed = Process-Races -Data $jsonData
                $Stats.Races += $processed.Count
                $processed | ConvertTo-Json -Depth 10 | Out-File -FilePath (Join-Path $OutputDir "races.json") -Encoding UTF8
                Write-Host "    Processed $($processed.Count) races" -ForegroundColor Green
            }
            elseif ($file.Name -match "backgrounds?") {
                $processed = Process-Backgrounds -Data $jsonData
                $Stats.Backgrounds += $processed.Count
                $processed | ConvertTo-Json -Depth 10 | Out-File -FilePath (Join-Path $OutputDir "backgrounds.json") -Encoding UTF8
                Write-Host "    Processed $($processed.Count) backgrounds" -ForegroundColor Green
            }
            elseif ($file.Name -match "feats?") {
                $processed = Process-Feats -Data $jsonData
                $Stats.Feats += $processed.Count
                $processed | ConvertTo-Json -Depth 10 | Out-File -FilePath (Join-Path $OutputDir "feats.json") -Encoding UTF8
                Write-Host "    Processed $($processed.Count) feats" -ForegroundColor Green
            }
        }
        catch {
            Write-Host "    ERROR: Failed to process $($file.Name)" -ForegroundColor Red
            Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
            $Stats.Errors++
        }
    }
}

# Process PDF files (requires PDF parsing - placeholder for future implementation)
$PdfFiles = Get-ChildItem -Path $InputDir -Filter "*.pdf" -ErrorAction SilentlyContinue
if ($PdfFiles) {
    Write-Host "`nPDF processing not yet implemented" -ForegroundColor Yellow
    Write-Host "  PDF files found: $($PdfFiles.Count)" -ForegroundColor Gray
    Write-Host "  Consider using PDF parsing library or manual extraction" -ForegroundColor Gray
}

# Processing functions (simplified - actual implementation depends on Free5e data structure)
function Process-Items {
    param($Data)
    # Placeholder - implement based on actual Free5e JSON structure
    return @()
}

function Process-Spells {
    param($Data)
    # Placeholder - implement based on actual Free5e JSON structure
    return @()
}

function Process-Monsters {
    param($Data)
    # Placeholder - implement based on actual Free5e JSON structure
    return @()
}

function Process-Classes {
    param($Data)
    # Placeholder - implement based on actual Free5e JSON structure
    return @()
}

function Process-Races {
    param($Data)
    # Placeholder - implement based on actual Free5e JSON structure
    return @()
}

function Process-Backgrounds {
    param($Data)
    # Placeholder - implement based on actual Free5e JSON structure
    return @()
}

function Process-Feats {
    param($Data)
    # Placeholder - implement based on actual Free5e JSON structure
    return @()
}

# Generate processing report
$Report = @{
    processed_at = (Get-Date -Format "o")
    input_directory = $InputDir
    output_directory = $OutputDir
    statistics = $Stats
    files_processed = @($JsonFiles, $PdfFiles | Where-Object { $_ }) | Measure-Object | Select-Object -ExpandProperty Count
}

$Report | ConvertTo-Json -Depth 10 | Out-File -FilePath (Join-Path $OutputDir "processing-report.json") -Encoding UTF8

Write-Host "`n=== Processing Summary ===" -ForegroundColor Cyan
Write-Host "Items: $($Stats.Items)" -ForegroundColor $(if ($Stats.Items -gt 0) { "Green" } else { "Gray" })
Write-Host "Spells: $($Stats.Spells)" -ForegroundColor $(if ($Stats.Spells -gt 0) { "Green" } else { "Gray" })
Write-Host "Monsters: $($Stats.Monsters)" -ForegroundColor $(if ($Stats.Monsters -gt 0) { "Green" } else { "Gray" })
Write-Host "Classes: $($Stats.Classes)" -ForegroundColor $(if ($Stats.Classes -gt 0) { "Green" } else { "Gray" })
Write-Host "Races: $($Stats.Races)" -ForegroundColor $(if ($Stats.Races -gt 0) { "Green" } else { "Gray" })
Write-Host "Backgrounds: $($Stats.Backgrounds)" -ForegroundColor $(if ($Stats.Backgrounds -gt 0) { "Green" } else { "Gray" })
Write-Host "Feats: $($Stats.Feats)" -ForegroundColor $(if ($Stats.Feats -gt 0) { "Green" } else { "Gray" })
Write-Host "Errors: $($Stats.Errors)" -ForegroundColor $(if ($Stats.Errors -gt 0) { "Red" } else { "Green" })

Write-Host "`nProcessing report saved to: $(Join-Path $OutputDir "processing-report.json")" -ForegroundColor Green
Write-Host "`nNext step: Run validate-free5e-data.ps1 to validate processed data" -ForegroundColor Gray

