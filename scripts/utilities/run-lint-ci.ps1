param(
    [int]$TimeoutSeconds = 240
)

$ErrorActionPreference = 'Stop'

function Write-Section([string]$message) {
    Write-Host "==> $message" -ForegroundColor Cyan
}

$repoRoot = Resolve-Path "$PSScriptRoot\..\.."
Set-Location $repoRoot

Write-Section "Starting lint with timeout $TimeoutSeconds seconds"

$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "npm"
$psi.Arguments = "run lint -- --max-warnings=0"
$psi.WorkingDirectory = $repoRoot
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$psi.UseShellExecute = $false
$psi.CreateNoWindow = $true

$process = New-Object System.Diagnostics.Process
$process.StartInfo = $psi
$process.Start() | Out-Null

$startTime = Get-Date

while (-not $process.HasExited) {
    while (-not $process.StandardOutput.EndOfStream) {
        Write-Host $process.StandardOutput.ReadLine()
    }
    while (-not $process.StandardError.EndOfStream) {
        Write-Host $process.StandardError.ReadLine() -ForegroundColor Yellow
    }

    $elapsed = (Get-Date) - $startTime
    if ($elapsed.TotalSeconds -ge $TimeoutSeconds) {
        Write-Section "Lint timed out after $($elapsed.TotalSeconds) seconds. Killing process..."
        try {
            $process.Kill()
        } catch {
            Write-Warning "Failed to terminate lint process: $_"
        }
        throw "Lint exceeded $TimeoutSeconds seconds."
    }

    Start-Sleep -Milliseconds 250
}

# Flush any remaining buffered output
while (-not $process.StandardOutput.EndOfStream) {
    Write-Host $process.StandardOutput.ReadLine()
}
while (-not $process.StandardError.EndOfStream) {
    Write-Host $process.StandardError.ReadLine() -ForegroundColor Yellow
}

$exitCode = $process.ExitCode

if ($exitCode -ne 0) {
    throw "Lint failed with exit code $exitCode"
}

Write-Section "Lint completed successfully in $([math]::Round(((Get-Date) - $startTime).TotalSeconds, 1)) seconds"

