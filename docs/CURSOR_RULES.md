# Cursor Operational Rules

This document mirrors the enforced instructions in `.cursorrules`. Keep both files in sync whenever patterns change.

## Terminal & Command Guardrails
- Never run long-lived or interactive commands in the Cursor terminal (`npm run dev`, watchers, prompts).
- Use `cmd /c` to execute shell commands; PowerShell `&&` is not supported.
- Cancel any command that produces no output for ~30 seconds unless explicitly expected.
- Prefer background execution (`-Background` flag) when a long-running job is required.

## Git Command Patterns (mandatory inside Cursor terminal)
```powershell
# Commit
$env:GIT_EDITOR=':'; $env:GIT_TERMINAL_PROMPT='0'; cmd /c git commit -m 'message' --no-verify

# Push
$env:GIT_TERMINAL_PROMPT='0'; cmd /c git push origin main

# Pull
$env:GIT_TERMINAL_PROMPT='0'; cmd /c git pull --rebase origin main --no-edit

# Add
cmd /c git add -A

# Status
cmd /c git status

# Diff (disables pager to prevent hangs)
cmd /c git --no-pager diff -- path/to/file

# Log
cmd /c git --no-pager log --oneline -N
```

**Why:** `cmd /c` ensures Git runs in a context that respects Cursor’s non-interactive terminal. Environment variables disable editor/credential prompts. `--no-pager` avoids `less` spawning and hanging.

## Validation Script
Use `scripts/validate-git-pattern.ps1` to check any new git command before running it inside Cursor:
```powershell
pwsh -ExecutionPolicy Bypass -File scripts/validate-git-pattern.ps1 -Command "commit" -Args @("-m", "message")
```
Supported `-Command` values: `commit`, `push`, `pull`, `add`, `status`, `diff`, `log`.

## Failure Learning System
1. When a git command fails or hangs, capture the exact command.
2. Add an entry to `docs/GIT_COMMAND_PATTERNS.md` under **Failure Log** with root cause.
3. Update `.cursorrules` and this document with the corrected pattern.
4. Record successful validations under **Success Log**.

## Build & Quality Loop
Before pushing:
1. `cmd /c npm run lint -- --max-warnings=0`
2. `cmd /c npx tsc --noEmit`
3. `cmd /c npm run test`
4. `cmd /c npm run build` (if time permits or pre-release)

If any step fails, fix the issue rather than suppressing the check.

## NPC Tooling
- `cmd /c npm run analyze-npcs` runs the Supabase-powered analysis script. Requires `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.
- `cmd /c npm run check-logs` surfaces the most recent Cloudflare deployment status.

## When in Doubt
- Re-read `.cursorrules` (source of truth).
- Ask clarifying questions before running unfamiliar commands.
- Document any new safe patterns here and in `.cursorrules`.

