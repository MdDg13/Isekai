# Command Allow/Deny List

## Allow List
- `cmd /c npm ci --no-fund --no-audit`
- `cmd /c npm run lint`
- `cmd /c npx tsc --noEmit`
- `cmd /c npm run test`
- `cmd /c npm run build` (prefer background)
- `cmd /c npm run check-logs`
- `cmd /c npm run auto-fix` (background)

## Deny List
- `npm run dev` (long running)
- Any `watch` command
- Any command that opens an editor or waits for input

## Notes
- On Windows/PowerShell, prefer `cmd /c` to invoke `npm.cmd` and avoid execution policy blocks.

