# Git Command Pattern Validator
# Validates Git command patterns before execution to prevent hangs

param(
    [Parameter(Mandatory=$true)]
    [string]$Command,
    
    [Parameter(Mandatory=$false)]
    [string[]]$Args = @()
)

$errors = @()
$warnings = @()

# Check if command contains problematic patterns
$fullCommand = "git $Command " + ($Args -join ' ')

# Check for && operator (PowerShell doesn't support)
if ($fullCommand -match '&&') {
    $errors += "ERROR: PowerShell doesn't support && operator. Use ; or separate commands."
}

# Check for Start-Job in Cursor context
if ($fullCommand -match 'Start-Job' -and $env:CURSOR_TERMINAL) {
    $warnings += "WARNING: Start-Job can hang in Cursor terminal. Use direct execution with cmd /c instead."
}

# Check commit-specific requirements
if ($Command -eq 'commit') {
    if ($Args -notcontains '--no-verify') {
        $warnings += "WARNING: Commit should include --no-verify to skip hooks"
    }
    if (-not $env:GIT_EDITOR) {
        $warnings += "WARNING: Should set GIT_EDITOR=':' before commit to prevent editor opening"
    }
    if ($Args -notcontains '-m' -and $Args -notcontains '--message') {
        $errors += "ERROR: Commit must include -m flag with message"
    }
}

# Check push/pull requirements
if ($Command -in @('push', 'pull', 'fetch')) {
    if (-not $env:GIT_TERMINAL_PROMPT) {
        $warnings += "WARNING: Should set GIT_TERMINAL_PROMPT='0' before network operations"
    }
}

# Check pull-specific requirements
if ($Command -eq 'pull') {
    if ($Args -notcontains '--rebase') {
        $warnings += "WARNING: Pull should use --rebase to avoid merge prompts"
    }
    if ($Args -notcontains '--no-edit') {
        $warnings += "WARNING: Pull should use --no-edit to prevent editor opening"
    }
}

# Output results
if ($errors.Count -gt 0) {
    Write-Host "VALIDATION FAILED:" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "  $error" -ForegroundColor Red
    }
    exit 1
}

if ($warnings.Count -gt 0) {
    Write-Host "VALIDATION WARNINGS:" -ForegroundColor Yellow
    foreach ($warning in $warnings) {
        Write-Host "  $warning" -ForegroundColor Yellow
    }
}

Write-Host "Pattern validation passed" -ForegroundColor Green
exit 0

