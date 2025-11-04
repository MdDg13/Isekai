# Cursor Agent Rules for Isekai

- Primary rules live in `.cursorrules`. This file adds operational guidance for higher autonomy.

## Allowed operations (non-interactive only)
- npm scripts via `cmd /c` to bypass PowerShell execution policy:
  - `cmd /c npm run lint`
  - `cmd /c npx tsc --noEmit`
  - `cmd /c npm run test`
  - `cmd /c npm run build` (use background for long runs)
  - `cmd /c npm ci --no-fund --no-audit`
- PowerShell scripts:
  - `scripts/auto-fix-cycle.ps1` (only via `npm run auto-fix`)
  - `scripts/check-logs.ps1` (only via `npm run check-logs`)
- File ops: create/edit/delete files, mkdir, write config.

## Disallowed operations
- Long-running or interactive processes:
  - `npm run dev`, watchers, prompts, or any command waiting for input
- Git commands requiring interaction (no editors, no rebases). If needed, add `--no-edit` or use CI.

## Background execution policy
- Run long tasks in background:
  - Build: `cmd /c npm run build` (background)
  - Auto-fix loop: `npm run auto-fix` (background)

## Default validation sequence
1) `cmd /c npm run lint`
2) `cmd /c npx tsc --noEmit`
3) `cmd /c npm run test`
4) `cmd /c npm run build` (background if necessary)

## Prompts for autonomous workflows
- Pre-PR fast check:
  - "Run pre-pr, fix any errors, and re-run until green."
- Test-driven feature scaffolding:
  - "Write tests first, implement code, run `npm run test`, iterate until tests pass."
- Build stabilization:
  - "Run `npx tsc --noEmit`; fix type errors; then run `npm run build` and iterate until success."

## Notes
- Static export is required; keep `output: 'export'`, `trailingSlash: true`, and `images.unoptimized: true`.
- Dynamic routes must have synchronous `generateStaticParams()`.
- Deployments are driven by GitHub Actions only; Cloudflare Pages Git integration is disabled. Logs are pushed to the `deployment-logs` branch with `[skip ci]`.

