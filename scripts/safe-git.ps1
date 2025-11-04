# Safe Git Command Wrapper with Timeouts
# Usage: .\safe-git.ps1 -Command "commit" -Args @("-m", "message")
# Usage: .\safe-git.ps1 -Command "push" -Args @("origin", "main")

param(
    [Parameter(Mandatory=$true)]
    [string]$Command,
    
    [Parameter(Mandatory=$false)]
    [string[]]$Args = @(),
    
    [Parameter(Mandatory=$false)]
    [int]$TimeoutSeconds = 15
)

# Set environment variables to prevent interactive prompts
$env:GIT_EDITOR = ':'
$env:GIT_TERMINAL_PROMPT = '0'
$env:GIT_CONFIG_NOSYSTEM = '1'

# Build git command
$gitArgs = @($Command) + $Args

# Add --no-verify for commit commands
if ($Command -eq 'commit' -and $Args -notcontains '--no-verify') {
    $gitArgs += '--no-verify'
}

# Execute with timeout using PowerShell job
$job = Start-Job -ScriptBlock {
    param($gitArgs)
    & git $gitArgs 2>&1
} -ArgumentList (,$gitArgs)

# Wait for job with timeout
$completed = $job | Wait-Job -Timeout $TimeoutSeconds

if (-not $completed) {
    # Timeout - stop the job
    Stop-Job $job
    Remove-Job $job -Force
    Write-Host "ERROR: Git command timed out after $TimeoutSeconds seconds" -ForegroundColor Red
    exit 1
}

# Get output
$output = Receive-Job $job
Remove-Job $job

# Write output
Write-Output $output

# Check exit code
if ($job.State -eq 'Failed') {
    exit 1
}

exit 0

