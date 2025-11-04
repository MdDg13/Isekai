# Terminal Hang Diagnosis - Current Status

## Current Project Location
- **Active Directory**: `C:\Users\Alex\Projects\App Development\Isekai`
- **NOT in OneDrive** - Migration complete
- All OneDrive references in docs are historical only

## If ALL Commands Hang (Current Issue)

### Symptoms
- Every command (even `Get-Process`) hangs indefinitely
- Cursor terminal shows no output
- Commands must be manually cancelled

### Root Cause
This indicates the **Cursor terminal session itself is deadlocked**, not a code or build issue.

### Immediate Actions (Do Outside Cursor)

1. **Check for Stuck Node.js Processes**
   ```powershell
   # Open PowerShell outside Cursor
   Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
   ```

2. **Kill Any TypeScript/Next.js Build Processes**
   ```powershell
   Get-Process | Where-Object { $_.ProcessName -like "*node*" -or $_.ProcessName -like "*tsc*" } | Stop-Process -Force
   ```

3. **Check for File Locks**
   ```powershell
   # Check if any files are locked
   Get-ChildItem -Path "C:\Users\Alex\Projects\App Development\Isekai" -Recurse -ErrorAction SilentlyContinue | Select-Object FullName
   ```

4. **Restart Cursor Completely**
   - Close all Cursor windows
   - End Cursor processes from Task Manager if needed
   - Reopen Cursor
   - Open the project fresh

5. **Clear Build Cache**
   ```powershell
   cd "C:\Users\Alex\Projects\App Development\Isekai"
   Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
   Remove-Item -Recurse -Force node_modules/.cache -ErrorAction SilentlyContinue
   ```

### If Still Hanging After Restart

1. **Check Cursor Terminal Settings**
   - Settings → Terminal → Shell Integration
   - Try switching between PowerShell and CMD

2. **Use External Terminal**
   - Open PowerShell outside Cursor
   - Navigate to project directory
   - Run commands there to verify they work

3. **Check Antivirus/Windows Defender**
   - May be scanning files and causing locks
   - Temporarily exclude project folder

4. **Check for Memory Issues**
   ```powershell
   Get-Process | Sort-Object WorkingSet -Descending | Select-Object -First 10
   ```

### Prevention Rules (Already in .cursorrules)

- Never run commands that can hang indefinitely
- Always use `cmd /c` wrapper for npm on Windows
- Clean `.next` if build hangs >60 seconds
- Fix React Hook dependencies immediately
- Use `useCallback` for functions in `useEffect` dependencies

### Code Fixes Applied

- ✅ Fixed React Hook dependencies in `campaign-client.tsx`
- ✅ Fixed React Hook dependencies in `page.tsx`
- ✅ Added build hang prevention rules to `.cursorrules`
- ✅ All `useEffect` hooks now use `useCallback` for functions

## Next Steps

1. **Restart Cursor** - This should resolve the terminal deadlock
2. **Verify in External Terminal** - Test commands work outside Cursor
3. **If Persistent** - May need to reinstall Cursor or check Windows event logs


