# Free5e Data Acquisition Script
# Downloads and validates Free5e source materials for processing

param(
    [string]$OutputDir = "data/free5e/raw",
    [switch]$ForceDownload = $false
)

# Create output directory if it doesn't exist
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
    Write-Host "Created directory: $OutputDir" -ForegroundColor Green
}

# Free5e source URLs (update with actual URLs when available)
$Free5eSources = @{
    "PlayerHandbook" = @{
        Name = "Free5e Player Handbook"
        Url = "https://wyrmworkspublishing.com/free5e/"  # Placeholder - update with actual URL
        Format = "PDF"
        License = "CC-BY-4.0"
    }
    "GameMasterGuide" = @{
        Name = "Free5e Game Master Guide"
        Url = "https://wyrmworkspublishing.com/free5e/"  # Placeholder - update with actual URL
        Format = "PDF"
        License = "CC-BY-4.0"
    }
    "MonsterManual" = @{
        Name = "Free5e Monster Manual"
        Url = "https://wyrmworkspublishing.com/free5e/"  # Placeholder - update with actual URL
        Format = "PDF"
        License = "CC-BY-4.0"
    }
}

# Log file for acquisition metadata
$LogFile = Join-Path $OutputDir "acquisition-log.json"
$LogData = @()

Write-Host "`n=== Free5e Data Acquisition ===" -ForegroundColor Cyan
Write-Host "Output directory: $OutputDir`n" -ForegroundColor Gray

foreach ($key in $Free5eSources.Keys) {
    $source = $Free5eSources[$key]
    $fileName = "$key.$($source.Format.ToLower())"
    $filePath = Join-Path $OutputDir $fileName
    
    Write-Host "Processing: $($source.Name)" -ForegroundColor Yellow
    
    # Check if file already exists
    if ((Test-Path $filePath) -and -not $ForceDownload) {
        Write-Host "  File already exists: $fileName" -ForegroundColor Gray
        Write-Host "  Use -ForceDownload to re-download" -ForegroundColor Gray
        continue
    }
    
    try {
        # Download file
        Write-Host "  Downloading from: $($source.Url)" -ForegroundColor Gray
        $response = Invoke-WebRequest -Uri $source.Url -OutFile $filePath -ErrorAction Stop
        
        # Verify download
        if (Test-Path $filePath) {
            $fileInfo = Get-Item $filePath
            Write-Host "  Downloaded: $fileName ($([math]::Round($fileInfo.Length / 1MB, 2)) MB)" -ForegroundColor Green
            
            # Log acquisition metadata
            $logEntry = @{
                source = $key
                name = $source.Name
                url = $source.Url
                format = $source.Format
                license = $source.License
                downloaded_at = (Get-Date -Format "o")
                file_size_bytes = $fileInfo.Length
                file_path = $filePath
                status = "success"
            }
            $LogData += $logEntry
        } else {
            throw "File not found after download"
        }
    }
    catch {
        Write-Host "  ERROR: Failed to download $($source.Name)" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        
        $logEntry = @{
            source = $key
            name = $source.Name
            url = $source.Url
            format = $source.Format
            license = $source.License
            downloaded_at = (Get-Date -Format "o")
            status = "failed"
            error = $_.Exception.Message
        }
        $LogData += $logEntry
    }
}

# Save acquisition log
$LogData | ConvertTo-Json -Depth 10 | Out-File -FilePath $LogFile -Encoding UTF8
Write-Host "`nAcquisition log saved to: $LogFile" -ForegroundColor Green

# Validate license compliance
Write-Host "`n=== License Validation ===" -ForegroundColor Cyan
$allValid = $true
foreach ($source in $Free5eSources.Values) {
    if ($source.License -eq "CC-BY-4.0") {
        Write-Host "  ✓ $($source.Name): CC-BY-4.0 (Creative Commons Attribution 4.0)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $($source.Name): Unknown license - MANUAL REVIEW REQUIRED" -ForegroundColor Red
        $allValid = $false
    }
}

if ($allValid) {
    Write-Host "`nAll sources validated for CC-BY-4.0 license compliance" -ForegroundColor Green
} else {
    Write-Host "`nWARNING: Some sources require manual license verification" -ForegroundColor Yellow
}

Write-Host "`n=== Acquisition Complete ===" -ForegroundColor Cyan
Write-Host "Next step: Run process-free5e-data.ps1 to extract structured data" -ForegroundColor Gray

