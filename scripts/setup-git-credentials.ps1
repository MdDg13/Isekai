# Setup Git Credentials for Non-Interactive Push
# This script helps set up git credentials to avoid interactive prompts in Cursor terminal

param(
    [Parameter(Mandatory=$false)]
    [string]$GitHubUsername = "MdDg13",
    
    [Parameter(Mandatory=$false)]
    [string]$PersonalAccessToken = ""
)

Write-Host "Setting up Git credential store..." -ForegroundColor Cyan

# Ensure credential helper is set to store
cmd /c git config --global credential.helper store
Write-Host "✓ Credential helper set to 'store'" -ForegroundColor Green

# If PAT provided, store credentials
if ($PersonalAccessToken) {
    $credentialsFile = "$env:USERPROFILE\.git-credentials"
    $credentialLine = "https://${GitHubUsername}:${PersonalAccessToken}@github.com"
    
    # Check if file exists and already contains github.com
    if (Test-Path $credentialsFile) {
        $existing = Get-Content $credentialsFile
        $githubLine = $existing | Where-Object { $_ -like "*github.com*" }
        if ($githubLine) {
            Write-Host "⚠ GitHub credentials already exist in .git-credentials" -ForegroundColor Yellow
            Write-Host "  Existing: $($githubLine -replace ':[^:@]+@', ':****@')" -ForegroundColor Gray
            $overwrite = Read-Host "Overwrite? (y/N)"
            if ($overwrite -ne 'y') {
                Write-Host "Keeping existing credentials" -ForegroundColor Yellow
                exit 0
            }
            # Remove existing github.com line
            $existing | Where-Object { $_ -notlike "*github.com*" } | Set-Content $credentialsFile
        }
    }
    
    # Append new credentials
    Add-Content -Path $credentialsFile -Value $credentialLine
    Write-Host "✓ Credentials stored in $credentialsFile" -ForegroundColor Green
    Write-Host "  Format: https://${GitHubUsername}:****@github.com" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "To store credentials, you have two options:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1: Run this script with PAT token:" -ForegroundColor Cyan
    Write-Host "  .\scripts\setup-git-credentials.ps1 -PersonalAccessToken 'YOUR_PAT_TOKEN'" -ForegroundColor White
    Write-Host ""
    Write-Host "Option 2: Create .git-credentials manually:" -ForegroundColor Cyan
    Write-Host "  1. Create file: $env:USERPROFILE\.git-credentials" -ForegroundColor White
    Write-Host "  2. Add line: https://${GitHubUsername}:YOUR_PAT_TOKEN@github.com" -ForegroundColor White
    Write-Host ""
    Write-Host "To create a Personal Access Token:" -ForegroundColor Cyan
    Write-Host "  1. Go to: https://github.com/settings/tokens" -ForegroundColor White
    Write-Host "  2. Generate new token (classic)" -ForegroundColor White
    Write-Host "  3. Select 'repo' scope" -ForegroundColor White
    Write-Host "  4. Copy the token" -ForegroundColor White
    Write-Host ""
}

Write-Host "Test push with:" -ForegroundColor Cyan
Write-Host "  `$env:GIT_TERMINAL_PROMPT='0'; cmd /c git push origin main" -ForegroundColor White

