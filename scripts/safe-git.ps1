# Safe Git Command Wrapper with Timeouts
# Usage: .\safe-git.ps1 -Command "commit" -Args @("-m", "message")
# Usage: .\safe-git.ps1 -Command "push" -Args @("origin", "main")

param(
    [Parameter(Mandatory=$true)]
    [string]$Command,
    
    [Parameter(Mandatory=$false)]
    [string[]]$Args = @(),
    
    [Parameter(Mandatory=$false)]
    [int]$TimeoutSeconds = 15,

    # When true, executes git directly without PowerShell jobs (recommended inside Cursor terminal)
    [switch]$Direct
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

if ($Direct) {
    # Direct execution path (no jobs). Best for integrated terminals where jobs can hang.
    $process = Start-Process -FilePath "git" -ArgumentList $gitArgs -NoNewWindow -PassThru -RedirectStandardOutput "STDOUT.txt" -RedirectStandardError "STDERR.txt"
    if ($process -and $TimeoutSeconds -gt 0) {
        $waited = $process.WaitForExit($TimeoutSeconds * 1000)
        if (-not $waited) {
            try { $process.Kill() } catch {}
            Write-Host "ERROR: Git command timed out after $TimeoutSeconds seconds" -ForegroundColor Red
            exit 1
        }
    } else {
        $process.WaitForExit()
    }
    if (Test-Path "STDOUT.txt") { Get-Content "STDOUT.txt" }
    if (Test-Path "STDERR.txt") { Get-Content "STDERR.txt" }
    if ($process.ExitCode -ne 0) { exit $process.ExitCode }
    exit 0
} else {
    # Execute with timeout using PowerShell job (good for CI, external terminals)
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
}

