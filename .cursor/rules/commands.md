# Command Allow/Deny List

## Allow List
- `cmd /c npm ci --no-fund --no-audit`
- `cmd /c npm run lint`
- `cmd /c npx tsc --noEmit`
- `cmd /c npm run test`
- `cmd /c npm run build` (prefer background)
- `cmd /c npm run check-logs`
- `cmd /c npm run auto-fix` (background)

### Git (safe, non-interactive patterns)
- Commit: `$env:GIT_EDITOR=':'; $env:GIT_TERMINAL_PROMPT='0'; cmd /c git commit -m "<msg>" --no-verify`
- Pull:   `$env:GIT_TERMINAL_PROMPT='0'; cmd /c git pull --rebase origin main --no-edit`
- Push:   `$env:GIT_TERMINAL_PROMPT='0'; cmd /c git push origin main`
- Change dir: `Set-Location -Path 'C:\\Users\\Alex\\Projects\\App Development\\Isekai'`

## Deny List
- `npm run dev` (long running)
- Any `watch` command
- Any command that opens an editor or waits for input
- PowerShell `Start-Job` for git operations inside Cursor
- Chaining with `&&` in PowerShell (use separate commands instead)

## Notes
- On Windows/PowerShell, prefer `cmd /c` to invoke `npm.cmd` and avoid execution policy blocks.
- In Cursor's integrated terminal: avoid `Start-Job` (jobs can lose CWD and hang). Use the safe git patterns above.
- Do not chain with `&&` in PowerShell; run separate commands or use `Set-Location` followed by a single command.

