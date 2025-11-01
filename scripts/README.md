# Auto-Fix Cycle Script

Automated build/test cycle that monitors deployments, reads logs, applies fixes, and iterates automatically.

## Features

- ✅ Monitors GitHub Actions deployments automatically
- ✅ Reads build logs from GitHub
- ✅ Analyzes failures and applies targeted fixes
- ✅ Tracks progress in `progress-log.md`
- ✅ Stops after 10 consecutive failures with analysis
- ✅ Fully autonomous operation

## Prerequisites

1. **GitHub CLI** installed and authenticated:
   ```powershell
   winget install GitHub.cli
   gh auth login
   ```

2. **Git** configured with your identity

## Usage

### Run the auto-fix cycle:

```powershell
npm run auto-fix
```

Or directly:

```powershell
.\scripts\auto-fix-cycle.ps1
```

### With custom parameters:

```powershell
.\scripts\auto-fix-cycle.ps1 -MaxFailures 5 -CheckInterval 20
```

## How It Works

1. **Monitors** latest commit for GitHub Actions deployment
2. **Waits** for deployment to complete (checks every 30s)
3. **Pulls** latest logs from GitHub repo
4. **Analyzes** build logs for specific error patterns
5. **Applies** targeted fixes automatically
6. **Commits** and pushes fixes
7. **Iterates** until success or max failures reached
8. **Reports** analysis if 10 failures hit

## Progress Log

All activity is logged to `scripts/progress-log.md`:
- Each attempt
- Detected issues
- Applied fixes
- Final analysis report

## Exit Conditions

- ✅ **Success**: Build passes → cycle stops
- ⚠️ **Max Failures**: 10 consecutive failures → stops with analysis
- 🛑 **Manual Intervention**: If fix cannot be determined automatically

## Fix Strategies

The script applies different fixes based on attempt count:

1. **Attempt 1-2**: Fix export patterns (async/non-async)
2. **Attempt 3**: Add explicit types and Promise.resolve
3. **Attempt 4+**: More drastic changes (disable static export)
4. **Attempt 5+**: Consider client-only route approach

## Notes

- Progress logs are excluded from git (`.gitignore`)
- Script respects existing git workflow
- Can be interrupted safely (Ctrl+C)
- Resumes from last state on re-run

