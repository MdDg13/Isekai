# Check commit size before pushing
# Prevents pushing large files that cause timeouts

param(
    [int]$MaxFileSizeMB = 10,
    [int]$MaxTotalSizeMB = 50
)

$ErrorActionPreference = "Stop"

Write-Host "Checking commit size before push..." -ForegroundColor Cyan

# Get files staged for commit
$stagedFiles = cmd /c git diff --cached --name-only 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "No staged files found. Checking files in last commit..." -ForegroundColor Yellow
    $stagedFiles = cmd /c git diff-tree --no-commit-id --name-only -r HEAD 2>&1
}

if (-not $stagedFiles) {
    Write-Host "No files to check." -ForegroundColor Green
    exit 0
}

$largeFiles = @()
$totalSize = 0
$fileCount = 0

foreach ($file in $stagedFiles) {
    if ([string]::IsNullOrWhiteSpace($file)) { continue }
    
    $filePath = $file.Trim()
    if (-not (Test-Path $filePath)) { continue }
    
    $fileInfo = Get-Item $filePath -ErrorAction SilentlyContinue
    if (-not $fileInfo) { continue }
    
    $sizeMB = [math]::Round($fileInfo.Length / 1MB, 2)
    $totalSize += $fileInfo.Length
    $fileCount++
    
    if ($sizeMB -gt $MaxFileSizeMB) {
        $largeFiles += [PSCustomObject]@{
            File = $filePath
            SizeMB = $sizeMB
        }
    }
}

$totalSizeMB = [math]::Round($totalSize / 1MB, 2)

Write-Host "`nCommit Summary:" -ForegroundColor Cyan
Write-Host "  Files: $fileCount" -ForegroundColor White
Write-Host "  Total Size: $totalSizeMB MB" -ForegroundColor White

if ($largeFiles.Count -gt 0) {
    Write-Host "`n⚠️  WARNING: Large files detected!" -ForegroundColor Red
    Write-Host "Files larger than $MaxFileSizeMB MB:" -ForegroundColor Yellow
    foreach ($file in $largeFiles) {
        Write-Host "  - $($file.File): $($file.SizeMB) MB" -ForegroundColor Red
    }
    Write-Host "`nThese files may cause push timeouts. Consider:" -ForegroundColor Yellow
    Write-Host "  1. Adding them to .gitignore" -ForegroundColor Yellow
    Write-Host "  2. Using Git LFS for large files" -ForegroundColor Yellow
    Write-Host "  3. Removing them from the commit: git reset HEAD <file>" -ForegroundColor Yellow
    exit 1
}

if ($totalSizeMB -gt $MaxTotalSizeMB) {
    Write-Host "`n⚠️  WARNING: Total commit size is large ($totalSizeMB MB)" -ForegroundColor Yellow
    Write-Host "This may cause push timeouts. Consider splitting into smaller commits." -ForegroundColor Yellow
    Write-Host "Continue anyway? (y/N): " -NoNewline -ForegroundColor Yellow
    $response = Read-Host
    if ($response -ne 'y' -and $response -ne 'Y') {
        Write-Host "Push cancelled." -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n✅ Commit size check passed!" -ForegroundColor Green
exit 0

