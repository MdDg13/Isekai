# Retrieve QC Feedback
# 
# This script helps retrieve feedback that was submitted through the QC review interface
# Feedback is stored in browser localStorage, so this script provides instructions
# for exporting it

param(
    [string]$OutputDir = "data/free5e/qc-feedback"
)

Write-Host "`n=== QC Feedback Retrieval ===`n" -ForegroundColor Cyan

# Check if localStorage backup exists
$localStorageBackup = Join-Path $OutputDir "localStorage-backup.json"
if (Test-Path $localStorageBackup) {
    Write-Host "Found localStorage backup file!" -ForegroundColor Green
    $feedback = Get-Content $localStorageBackup -Raw | ConvertFrom-Json
    Write-Host "  Total feedback items: $($feedback.Count)" -ForegroundColor White
    
    # Group by issue type
    $byIssue = $feedback | Group-Object -Property issue
    Write-Host "`nFeedback by issue type:" -ForegroundColor Yellow
    foreach ($group in $byIssue) {
        Write-Host "  $($group.Name): $($group.Count)" -ForegroundColor White
    }
    
    # Group by data type
    $byDataType = $feedback | Group-Object -Property dataType
    Write-Host "`nFeedback by data type:" -ForegroundColor Yellow
    foreach ($group in $byDataType) {
        Write-Host "  $($group.Name): $($group.Count)" -ForegroundColor White
    }
    
    Write-Host "`nTo analyze this feedback, run:" -ForegroundColor Cyan
    Write-Host "  npm run qc-analyze $OutputDir" -ForegroundColor White
} else {
    Write-Host "No localStorage backup found." -ForegroundColor Yellow
    Write-Host "`nTo retrieve feedback from browser localStorage:" -ForegroundColor Cyan
    Write-Host "  1. Open scripts/export-localStorage-feedback.html in your browser" -ForegroundColor White
    Write-Host "  2. Click 'Export Feedback' button" -ForegroundColor White
    Write-Host "  3. Save the file to: $localStorageBackup" -ForegroundColor White
    Write-Host "  4. Run this script again to view the feedback" -ForegroundColor White
}

# Check for other feedback files
Write-Host "`nChecking for other feedback files..." -ForegroundColor Cyan
$feedbackFiles = Get-ChildItem -Path $OutputDir -Filter "*-feedback.json" -ErrorAction SilentlyContinue
if ($feedbackFiles) {
    Write-Host "Found $($feedbackFiles.Count) feedback file(s):" -ForegroundColor Green
    foreach ($file in $feedbackFiles) {
        Write-Host "  - $($file.Name)" -ForegroundColor White
    }
} else {
    Write-Host "No other feedback files found." -ForegroundColor Gray
}

Write-Host "`n=== Complete ===`n" -ForegroundColor Cyan

