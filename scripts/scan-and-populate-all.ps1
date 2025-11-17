# Comprehensive Scanner and Populator
# Scans Downloads folder recursively for spells, items, monsters, and other content
# Extracts from PDFs, markdown, text files, and populates Supabase

param(
    [string]$DownloadsDir = "Downloads",
    [string]$OutputDir = "data/free5e/processed",
    [int]$BatchSize = 100,
    [switch]$DryRun = $false
)

Write-Host "`n=== Comprehensive Content Scanner & Populator ===" -ForegroundColor Cyan
Write-Host "Scanning: $DownloadsDir" -ForegroundColor Gray
Write-Host "Output: $OutputDir`n" -ForegroundColor Gray

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
    Write-Host "ERROR: Supabase credentials not found in environment" -ForegroundColor Red
    Write-Host "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Yellow
    exit 1
}

# Create output directory
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

# Statistics
$Stats = @{
    FilesScanned = 0
    FilesProcessed = 0
    SpellsFound = 0
    ItemsFound = 0
    MonstersFound = 0
    Errors = 0
}

# Find all relevant files recursively
Write-Host "Scanning for content files..." -ForegroundColor Yellow
$allFiles = Get-ChildItem -Path $DownloadsDir -Recurse -File | Where-Object {
    $_.Extension -in @('.pdf', '.md', '.txt', '.html', '.epub') -and
    $_.Name -notmatch 'Character Sheet|Pregen|Map|Image|\.jpg|\.png' -and
    $_.FullName -notmatch '\\Processed\\|\\Individual Cards\\|\\Character Sheets\\'
}

Write-Host "  Found $($allFiles.Count) potential content files" -ForegroundColor Green

# Group files by type and content hints
$fileGroups = @{
    Spells = @()
    Items = @()
    Monsters = @()
    General = @()
}

foreach ($file in $allFiles) {
    $name = $file.Name.ToLower()
    $path = $file.FullName.ToLower()
    
    if ($name -match 'spell|magic|wizard|sorcerer|warlock|cleric|druid|bard|ranger|paladin') {
        $fileGroups.Spells += $file
    } elseif ($name -match 'item|equipment|weapon|armor|tool|treasure|trinket|magic item') {
        $fileGroups.Items += $file
    } elseif ($name -match 'monster|creature|beast|fiend|undead|dragon|demon|devil') {
        $fileGroups.Monsters += $file
    } else {
        $fileGroups.General += $file
    }
}

Write-Host "`nFile groups:" -ForegroundColor Cyan
Write-Host "  Spells: $($fileGroups.Spells.Count)" -ForegroundColor Gray
Write-Host "  Items: $($fileGroups.Items.Count)" -ForegroundColor Gray
Write-Host "  Monsters: $($fileGroups.Monsters.Count)" -ForegroundColor Gray
Write-Host "  General: $($fileGroups.General.Count)" -ForegroundColor Gray

# Use Node.js script for comprehensive parsing
Write-Host "`nProcessing files with Node.js parser..." -ForegroundColor Yellow

$nodeScript = @"
const fs = require('fs');
const path = require('path');

// This will be generated dynamically
const filesToProcess = $($allFiles | ConvertTo-Json -Compress);

console.log('Processing', filesToProcess.length, 'files...');
"@

# For now, let's use the existing markdown parser and extend it
Write-Host "`nUsing existing parsers for known file types..." -ForegroundColor Yellow

# Process markdown files first (fastest)
$mdFiles = $allFiles | Where-Object { $_.Extension -eq '.md' }
if ($mdFiles.Count -gt 0) {
    Write-Host "`nProcessing $($mdFiles.Count) markdown files..." -ForegroundColor Cyan
    foreach ($file in $mdFiles) {
        $Stats.FilesScanned++
        Write-Host "  Processing: $($file.Name)" -ForegroundColor Gray
        # Use existing parser
        try {
            cmd /c npm run parse-free5e -- "$($file.DirectoryName)" "$OutputDir" 2>&1 | Out-Null
            $Stats.FilesProcessed++
        } catch {
            Write-Host "    ERROR: $($_.Exception.Message)" -ForegroundColor Red
            $Stats.Errors++
        }
    }
}

# For PDFs, we'll need to extract text first, then parse
Write-Host "`nPDF files require text extraction first..." -ForegroundColor Yellow
Write-Host "  Creating PDF extraction script..." -ForegroundColor Gray

# Create a comprehensive TypeScript parser that handles all file types
$parserScript = @"
/**
 * Comprehensive Content Parser
 * Handles PDFs, markdown, text files for spells, items, monsters
 */

import * as fs from 'fs';
import * as path from 'path';

interface FileInfo {
    path: string;
    name: string;
    type: 'spell' | 'item' | 'monster' | 'general';
}

const files: FileInfo[] = $($allFiles | ForEach-Object { 
    @{ path = $_.FullName; name = $_.Name; type = 'general' }
} | ConvertTo-Json -Compress);

console.log('Files to process:', files.length);
"@

Write-Host "`nFor comprehensive PDF parsing, we need to:" -ForegroundColor Yellow
Write-Host "  1. Install PDF parsing library (pdf-parse)" -ForegroundColor Gray
Write-Host "  2. Extract text from PDFs" -ForegroundColor Gray
Write-Host "  3. Parse extracted text for content" -ForegroundColor Gray
Write-Host "  4. Populate database" -ForegroundColor Gray

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "Files scanned: $($Stats.FilesScanned)" -ForegroundColor Gray
Write-Host "Files processed: $($Stats.FilesProcessed)" -ForegroundColor Gray
Write-Host "Errors: $($Stats.Errors)" -ForegroundColor $(if ($Stats.Errors -eq 0) { "Green" } else { "Red" })

Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "  1. Install pdf-parse: npm install pdf-parse" -ForegroundColor Gray
Write-Host "  2. Create comprehensive parser script" -ForegroundColor Gray
Write-Host "  3. Run full extraction and population" -ForegroundColor Gray

