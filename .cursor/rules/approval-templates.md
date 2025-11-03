# Approval Templates for Autonomy

## Fast loop (pre-PR)
Run `pre-pr` and fix until green. You may:
- Edit files to resolve ESLint/TS errors
- Create small helper modules
- Update tests

Do NOT:
- Run dev servers, watchers, or interactive commands

## Full loop
1) Run `pre-pr` and fix
2) Run `npm run build` (background if needed)
3) If green, optionally run `npm run e2e` when envs are present

If any step fails, iterate on code and re-run.

