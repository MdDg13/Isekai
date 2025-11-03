# Project Migration Plan: OneDrive to Local Drive

## Migration Steps

1. **Create destination directory**
   - Location: `C:\Users\Alex\Projects\Isekai`
   - Ensure directory doesn't exist first

2. **Copy project files** (not move initially - safer)
   - Exclude: `node_modules/`, `.next/`, `out/`
   - Preserve: Git history, all source files

3. **Verify Git works** in new location
   - Check git status
   - Verify remote connection

4. **Update any hardcoded paths** if needed
   - Check scripts for paths
   - Update documentation

5. **Test build** in new location
   - Run `npm install`
   - Run `npm run build`

6. **Once verified, delete old location**

## Commands to Run

```powershell
# Create new directory
New-Item -ItemType Directory -Path "C:\Users\Alex\Projects" -Force | Out-Null

# Copy project (excluding large dirs)
robocopy "C:\Users\Alex\OneDrive\App Development\Isekai" "C:\Users\Alex\Projects\Isekai" /E /XD node_modules .next out test-results /XF .lock

# Verify Git in new location
cd "C:\Users\Alex\Projects\Isekai"
git status
git remote -v
```

