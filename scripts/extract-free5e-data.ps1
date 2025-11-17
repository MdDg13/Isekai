# Free5e Data Extraction Script
# Extracts structured data from downloaded Free5e files (PDF, MD, etc.)

param(
    [string]$InputDir = "Downloads",
    [string]$OutputDir = "data/free5e/processed",
    [switch]$UseMarkdown = $true,  # Prefer .md files over PDFs when available
    [switch]$ParseMarkdown = $true  # Run markdown parser after extraction
)

Write-Host "`n=== Free5e Data Extraction ===" -ForegroundColor Cyan
Write-Host "Input directory: $InputDir" -ForegroundColor Gray
Write-Host "Output directory: $OutputDir`n" -ForegroundColor Gray

# Create output directory
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

# Identify Free5e files
$Free5eFiles = @{
    "Characters_Codex" = @{
        Type = "PlayerHandbook"
        Files = @()
    }
    "Free5e_Conductors_Companion" = @{
        Type = "GameMasterGuide"
        Files = @()
    }
    "Free5e_Monstrous_Manuscript" = @{
        Type = "MonsterManual"
        Files = @()
    }
}

# Find files in Downloads directory
$DownloadsPath = Join-Path (Get-Location) $InputDir
if (-not (Test-Path $DownloadsPath)) {
    Write-Host "ERROR: Downloads directory not found: $DownloadsPath" -ForegroundColor Red
    exit 1
}

Write-Host "Scanning for Free5e files..." -ForegroundColor Yellow

foreach ($key in $Free5eFiles.Keys) {
    $files = Get-ChildItem -Path $DownloadsPath -Filter "$key*" -ErrorAction SilentlyContinue
    if ($files) {
        $Free5eFiles[$key].Files = $files
        Write-Host "  Found $($files.Count) file(s) for $key" -ForegroundColor Green
    }
}

# Process each Free5e source
foreach ($sourceKey in $Free5eFiles.Keys) {
    $source = $Free5eFiles[$sourceKey]
    $files = $source.Files
    
    if ($files.Count -eq 0) {
        Write-Host "`nSkipping $sourceKey - no files found" -ForegroundColor Gray
        continue
    }
    
    Write-Host "`nProcessing $sourceKey ($($source.Type))..." -ForegroundColor Yellow
    
    # Prefer markdown, then other text formats, then PDF
    $preferredFile = $null
    if ($UseMarkdown) {
        $preferredFile = $files | Where-Object { $_.Extension -eq ".md" } | Select-Object -First 1
    }
    if (-not $preferredFile) {
        $preferredFile = $files | Where-Object { $_.Extension -in @(".txt", ".html") } | Select-Object -First 1
    }
    if (-not $preferredFile) {
        $preferredFile = $files | Where-Object { $_.Extension -eq ".pdf" } | Select-Object -First 1
    }
    if (-not $preferredFile) {
        $preferredFile = $files | Select-Object -First 1
    }
    
    if ($preferredFile) {
        Write-Host "  Using file: $($preferredFile.Name)" -ForegroundColor Gray
        
        # Extract based on file type
        $extractedText = $null
        
        if ($preferredFile.Extension -eq ".md" -or $preferredFile.Extension -eq ".txt") {
            Write-Host "  Extracting text from $($preferredFile.Extension) file..." -ForegroundColor Gray
            $extractedText = Get-Content -Path $preferredFile.FullName -Raw -Encoding UTF8
        }
        elseif ($preferredFile.Extension -eq ".pdf") {
            Write-Host "  PDF extraction requires Node.js script..." -ForegroundColor Yellow
            Write-Host "  Creating extraction script..." -ForegroundColor Gray
            
            # Create Node.js script for PDF extraction
            $nodeScript = @"
const fs = require('fs');
const pdf = require('pdf-parse');

async function extractPDF() {
    const dataBuffer = fs.readFileSync('$($preferredFile.FullName.Replace('\', '/'))');
    const data = await pdf(dataBuffer);
    console.log(data.text);
}

extractPDF().catch(console.error);
"@
            
            $scriptPath = Join-Path $OutputDir "extract-pdf-temp.js"
            $nodeScript | Out-File -FilePath $scriptPath -Encoding UTF8
            
            # Check if pdf-parse is installed
            $hasPdfParse = npm list pdf-parse 2>$null
            if (-not $hasPdfParse) {
                Write-Host "  Installing pdf-parse..." -ForegroundColor Yellow
                npm install pdf-parse --save-dev 2>&1 | Out-Null
            }
            
            Write-Host "  Running PDF extraction..." -ForegroundColor Gray
            $extractedText = node $scriptPath 2>&1 | Out-String
            
            # Clean up temp script
            Remove-Item -Path $scriptPath -ErrorAction SilentlyContinue
        }
        else {
            Write-Host "  Unsupported file type: $($preferredFile.Extension)" -ForegroundColor Red
            continue
        }
        
        if ($extractedText) {
            # Save extracted text
            $textOutputPath = Join-Path $OutputDir "$sourceKey-extracted.txt"
            $extractedText | Out-File -FilePath $textOutputPath -Encoding UTF8
            Write-Host "  Extracted text saved to: $textOutputPath" -ForegroundColor Green
            Write-Host "  Text length: $($extractedText.Length) characters" -ForegroundColor Gray
            
            # Process based on source type
            Write-Host "  Processing structured data..." -ForegroundColor Gray
            
            if ($source.Type -eq "PlayerHandbook") {
                # Extract items, spells, classes, races, backgrounds, feats
                Write-Host "    Extracting items, spells, classes, races, backgrounds, feats..." -ForegroundColor Gray
                # This will be handled by the Node.js processing script
            }
            elseif ($source.Type -eq "MonsterManual") {
                # Extract monsters
                Write-Host "    Extracting monsters..." -ForegroundColor Gray
                # This will be handled by the Node.js processing script
            }
            elseif ($source.Type -eq "GameMasterGuide") {
                # Extract GM-specific content
                Write-Host "    Extracting GM guide content..." -ForegroundColor Gray
                # This will be handled by the Node.js processing script
            }
        }
    }
}

# Run markdown parser if markdown files were found and ParseMarkdown is enabled
if ($ParseMarkdown) {
    $mdFiles = Get-ChildItem -Path $DownloadsPath -Filter "*Characters_Codex*.md" -ErrorAction SilentlyContinue
    $mdFiles += Get-ChildItem -Path $DownloadsPath -Filter "*Monstrous_Manuscript*.md" -ErrorAction SilentlyContinue
    
    if ($mdFiles.Count -gt 0) {
        Write-Host "`n=== Running Markdown Parser ===" -ForegroundColor Cyan
        
        # Check if Node.js is available
        $nodeAvailable = Get-Command node -ErrorAction SilentlyContinue
        if ($nodeAvailable) {
            # Compile TypeScript if needed, or run directly with ts-node/tsx
            $tsxAvailable = Get-Command npx -ErrorAction SilentlyContinue
            if ($tsxAvailable) {
                Write-Host "Running TypeScript parser via npx tsx..." -ForegroundColor Gray
                npx tsx scripts/parse-free5e-markdown.ts $DownloadsPath $OutputDir
            } else {
                Write-Host "TypeScript execution not available. Please run manually:" -ForegroundColor Yellow
                Write-Host "  npx tsx scripts/parse-free5e-markdown.ts `"$DownloadsPath`" `"$OutputDir`"" -ForegroundColor Gray
            }
        } else {
            Write-Host "Node.js not found. Please install Node.js to run the parser." -ForegroundColor Yellow
            Write-Host "Alternatively, run manually: npx tsx scripts/parse-free5e-markdown.ts `"$DownloadsPath`" `"$OutputDir`"" -ForegroundColor Gray
        }
    }
}

Write-Host "`n=== Extraction Complete ===" -ForegroundColor Cyan
Write-Host "Next step: Run validate-free5e-data.ps1 to validate extracted data" -ForegroundColor Gray

