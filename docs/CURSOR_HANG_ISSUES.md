# Cursor Command Hang Issues - Analysis & Solutions

## Problem Summary
Cursor AI has been hanging when executing commands, requiring manual cancellation. This document analyzes causes and provides solutions.

## Root Causes

### 1. **OneDrive File Sync Interference**
- **Issue**: Files in OneDrive (`C:\Users\Alex\OneDrive\...`) are being synced
- **Impact**: Git operations, file reads/writes can hang waiting for file locks
- **Symptom**: Commands that touch files hang indefinitely

### 2. **Git Operations Waiting for Input**
- **Issue**: Git commands may be waiting for:
  - Credential prompts (though should be cached)
  - Merge conflict resolution prompts
  - Rebase interactive prompts
- **Impact**: Commands hang waiting for user input that never comes
- **Symptom**: Git commands (pull, push, status) hang

### 3. **PowerShell Execution Policy**
- **Issue**: Some PowerShell commands might be blocked by execution policy
- **Impact**: Scripts fail or hang
- **Symptom**: `.ps1` scripts don't run

### 4. **Long-Running Processes**
- **Issue**: Commands like `npm run dev`, `watch` commands run indefinitely
- **Impact**: Cursor waits forever for process to complete
- **Symptom**: Background processes block terminal

### 5. **Network Operations Without Timeouts**
- **Issue**: Git fetch/pull operations may wait indefinitely for network
- **Impact**: Commands hang on slow/unstable connections
- **Symptom**: Network operations hang

## Immediate Solutions

### 1. **Move Project Out of OneDrive** (RECOMMENDED)
```powershell
# Move project to local drive (faster, no sync interference)
# From: C:\Users\Alex\OneDrive\App Development\Isekai
# To:   C:\Users\Alex\Projects\Isekai  (or similar)
```
**Benefits**:
- No file sync delays
- Faster file operations
- No file lock conflicts
- Better Git performance

### 2. **Use Fast Git Commands with Timeouts**
```powershell
# Add timeout to git operations
$env:GIT_TERMINAL_PROMPT=0  # Disable credential prompts
git -c core.askpass= fetch origin main --quiet --timeout=10
```

### 3. **Use Non-Interactive Flags**
```powershell
# Always use non-interactive flags
git pull origin main --quiet --no-edit
git push origin main --quiet
npm install --no-fund --no-audit
```

### 4. **Add Timeouts to Long Operations**
```powershell
# Use Job with timeout
$job = Start-Job -ScriptBlock { git pull origin main }
Wait-Job $job -Timeout 30
if ($job.State -eq 'Running') { Stop-Job $job; Remove-Job $job }
```

### 5. **Exclude Project from OneDrive Sync** (Alternative)
If moving isn't possible:
1. Right-click project folder in OneDrive
2. Select "Always keep on this device"
3. Consider excluding `node_modules/`, `.next/` from sync

## Best Practices Going Forward

### ✅ Safe Command Patterns
```powershell
# Quick checks (safe)
git status --short
Test-Path .cursorrules
Get-Content file.txt -TotalCount 10

# Git operations with timeouts
git fetch origin main --quiet 2>&1 | Out-Null
git pull origin main --rebase --quiet --no-edit 2>&1 | Out-Null

# File operations (simple)
New-Item -ItemType Directory -Path .cursor/rules -Force | Out-Null
```

### ❌ Avoid These Patterns
```powershell
# DON'T: Commands without timeouts
git pull  # Can hang

# DON'T: Long-running processes
npm run dev  # Runs forever

# DON'T: Commands waiting for input
git commit -m ""  # Opens editor

# DON'T: Complex file operations in OneDrive
Get-ChildItem -Recurse  # Can hang on large OneDrive folders
```

## Cursor-Specific Recommendations

### 1. **Use Read/Write Tools Instead of Commands**
- Prefer `read_file`, `write`, `search_replace` tools over `git` commands for simple operations
- Use `run_terminal_cmd` only for:
  - Quick status checks
  - Operations that MUST be terminal-based
  - Operations with explicit timeouts

### 2. **Break Complex Operations into Steps**
Instead of:
```powershell
git add . ; git commit -m "fix" ; git push  # Can hang on any step
```

Do:
```powershell
# Step 1: Quick check
git status --short

# Step 2: Add with timeout
git add . 2>&1 | Out-Null

# Step 3: Commit with message (not editor)
git commit -m "fix: something" 2>&1 | Out-Null

# Step 4: Push with timeout check
```

### 3. **Use Background Jobs for Long Operations**
```powershell
# Start background job
Start-Job -ScriptBlock { npm run build } | Out-Null

# Check status later
Get-Job | Where-Object { $_.State -eq 'Running' }
```

## Current Project Status

### Project Location
- **Current**: `C:\Users\Alex\Projects\App Development\Isekai` ✅ **MIGRATED - NOT IN ONEDRIVE**
- **Previous**: Was in `C:\Users\Alex\OneDrive\App Development\Isekai` (migration complete)

### Git Configuration
- Ensure credential manager is set up: `git config --global credential.helper manager-core`
- Use SSH instead of HTTPS if possible (no credential prompts)

### ~~OneDrive Impact~~ (RESOLVED - Project Migrated)
- ✅ Project is now in local storage: `C:\Users\Alex\Projects\App Development\Isekai`
- ✅ No OneDrive sync interference
- ✅ File operations should be fast

## Action Items

1. **Short Term** (Now):
   - ✅ Add timeout checks to all git commands
   - ✅ Use non-interactive flags everywhere
   - ✅ Prefer file tools over terminal commands where possible

2. **Medium Term** (This Week):
   - Move project to non-OneDrive location
   - Configure Git to avoid prompts
   - Test all common commands with timeouts

3. **Long Term** (Ongoing):
   - Monitor for hanging patterns
   - Update `.cursorrules` with new safe patterns
   - Document any new hanging scenarios

## References
- Cursor Documentation: https://docs.cursor.com
- Git Timeout Options: https://git-scm.com/docs
- PowerShell Best Practices: https://docs.microsoft.com/powershell

