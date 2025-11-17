# Git Push Hang - Problem Analysis & Solutions

## Problem Summary

**Symptom**: `git push origin main` hangs indefinitely in Cursor terminal, even with `GIT_TERMINAL_PROMPT='0'`

**Root Cause**: Windows Credential Manager (`credential.helper=manager`) attempts to interactively prompt for GitHub credentials, but Cursor's integrated terminal cannot handle the interactive prompt, causing the command to hang.

**Current Configuration**:
- Remote URL: `https://github.com/MdDg13/Isekai/` (HTTPS)
- Credential Helper: `manager` (Windows Credential Manager)
- User: `Alex Peck <alexpeck@hotmail.com>`

## Solution Options (Ranked by Ease)

### ✅ Option 1: Use Git Credential Store (File-Based) - RECOMMENDED

**How it works**: Store credentials in a plain text file instead of Windows Credential Manager.

**Steps**:
1. Create a Personal Access Token (PAT) on GitHub:
   - Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate new token with `repo` scope
   - Copy the token

2. Configure git to use file-based credential store:
   ```powershell
   # Set credential helper to store (file-based)
   cmd /c git config --global credential.helper store
   
   # This will create ~/.git-credentials file
   ```

3. Trigger credential storage by attempting a push (it will prompt once, then store):
   ```powershell
   # First push will prompt for username/password
   # Username: your GitHub username
   # Password: use the PAT token (not your GitHub password)
   $env:GIT_TERMINAL_PROMPT='0'; cmd /c git push origin main
   ```

**Pros**:
- ✅ Works with non-interactive terminals
- ✅ Credentials stored locally
- ✅ No interactive prompts after first use
- ✅ Works with Cursor terminal

**Cons**:
- ⚠️ Credentials stored in plain text (but in user's home directory, protected by Windows)
- ⚠️ Need to create and manage PAT token

**Status**: ✅ Best solution for Cursor terminal

---

### Option 2: Embed Credentials in Remote URL

**How it works**: Embed username and PAT token directly in the remote URL.

**Steps**:
1. Create a Personal Access Token (PAT) on GitHub (same as Option 1)

2. Update remote URL with embedded credentials:
   ```powershell
   # Format: https://USERNAME:TOKEN@github.com/OWNER/REPO.git
   cmd /c git remote set-url origin https://MdDg13:YOUR_PAT_TOKEN@github.com/MdDg13/Isekai.git
   ```

3. Push normally:
   ```powershell
   $env:GIT_TERMINAL_PROMPT='0'; cmd /c git push origin main
   ```

**Pros**:
- ✅ No credential prompts
- ✅ Works immediately
- ✅ Works with Cursor terminal

**Cons**:
- ⚠️ Credentials visible in `git remote -v` output
- ⚠️ Credentials stored in `.git/config` (plain text)
- ⚠️ Need to update if token expires
- ⚠️ Less secure (credentials in repo config)

**Status**: ✅ Works but less secure

---

### Option 3: Switch to SSH Authentication

**How it works**: Use SSH keys instead of HTTPS, bypassing credential manager entirely.

**Steps**:
1. Check if SSH keys exist:
   ```powershell
   Test-Path "$env:USERPROFILE\.ssh\id_rsa.pub"
   ```

2. If no SSH key, generate one:
   ```powershell
   ssh-keygen -t ed25519 -C "alexpeck@hotmail.com"
   # Press Enter to accept default location
   # Optionally set a passphrase (or leave empty)
   ```

3. Add SSH key to GitHub:
   - Copy public key: `Get-Content "$env:USERPROFILE\.ssh\id_ed25519.pub"`
   - Go to GitHub → Settings → SSH and GPG keys → New SSH key
   - Paste the public key

4. Change remote URL to SSH:
   ```powershell
   cmd /c git remote set-url origin git@github.com:MdDg13/Isekai.git
   ```

5. Test SSH connection:
   ```powershell
   ssh -T git@github.com
   # Should say: "Hi MdDg13! You've successfully authenticated..."
   ```

6. Push normally:
   ```powershell
   $env:GIT_TERMINAL_PROMPT='0'; cmd /c git push origin main
   ```

**Pros**:
- ✅ No credential prompts
- ✅ More secure (key-based authentication)
- ✅ Works with Cursor terminal
- ✅ No token expiration

**Cons**:
- ⚠️ Requires SSH key setup (one-time)
- ⚠️ Need to manage SSH keys
- ⚠️ More complex initial setup

**Status**: ✅ Best long-term solution

---

### Option 4: Temporarily Disable Credential Helper

**How it works**: Disable credential helper for a single push operation.

**Steps**:
```powershell
# Push with credential helper disabled
$env:GIT_TERMINAL_PROMPT='0'; $env:GIT_ASKPASS='echo'; cmd /c git -c credential.helper= push origin main
```

**Pros**:
- ✅ Quick one-time solution
- ✅ No configuration changes

**Cons**:
- ❌ Will fail if credentials not pre-stored
- ❌ Not a permanent solution
- ❌ May still prompt for credentials

**Status**: ⚠️ Unlikely to work (will fail without credentials)

---

### Option 5: Use GIT_ASKPASS with Echo

**How it works**: Provide a dummy askpass program that returns empty, forcing git to use stored credentials.

**Steps**:
```powershell
# Create a simple askpass script
$askpassScript = @'
@echo off
exit /b 1
'@
$askpassScript | Out-File -FilePath "$env:TEMP\git-askpass.bat" -Encoding ASCII

# Use it for push
$env:GIT_ASKPASS="$env:TEMP\git-askpass.bat"; $env:GIT_TERMINAL_PROMPT='0'; cmd /c git push origin main
```

**Pros**:
- ✅ Bypasses credential manager
- ✅ Works with stored credentials

**Cons**:
- ❌ Requires credentials to be pre-stored
- ❌ Complex setup
- ❌ May not work if credentials not available

**Status**: ⚠️ Unlikely to work without pre-stored credentials

---

### Option 6: Use Start-Process with Timeout (PowerShell Job)

**How it works**: Run git push in a separate process with timeout, similar to `safe-git.ps1`.

**Steps**:
```powershell
# Use the existing safe-git.ps1 script
powershell -ExecutionPolicy Bypass -File scripts/safe-git.ps1 -Command "push" -Args @("origin", "main") -TimeoutSeconds 30 -Direct
```

**Pros**:
- ✅ Has timeout protection
- ✅ Uses existing script
- ✅ Can kill hung processes

**Cons**:
- ❌ Still hangs on credential prompt (timeout just kills it)
- ❌ Doesn't solve root cause
- ❌ May fail if credentials not available

**Status**: ⚠️ Doesn't solve the credential issue

---

## Recommended Solution

**For immediate fix**: **Option 1 (Git Credential Store)** or **Option 2 (Embedded URL)**

**For long-term**: **Option 3 (SSH Authentication)**

## Implementation Plan

1. **Immediate**: Implement Option 1 (credential store) - fastest, most reliable
2. **Future**: Consider migrating to Option 3 (SSH) for better security

## Testing

After implementing a solution, test with:
```powershell
$env:GIT_TERMINAL_PROMPT='0'; cmd /c git push origin main
```

Should complete in < 10 seconds if working correctly.

