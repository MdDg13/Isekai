## AI Asset Pipeline

This project can now auto-generate textures, portraits, icons, and other art using **Cloudflare Workers AI**.

### 1. Configure secrets

You must create a `.env.local` file in the repo root **before** running any AI generation.

1. In Cursor’s terminal, make sure you’re in the project root (`C:\Users\Alex\Projects\App Development\Isekai`).
2. Run:
   ```
   New-Item -Path .env.local -ItemType File -Force
   ```
   (This creates an empty file; re-running overwrites nothing because `-Force` just keeps it.)
3. Open `.env.local` in Cursor (or any editor) and paste:
   ```
   CF_ACCOUNT_ID=9b19a6844783aa1bc6a7ee3e978cfcad
   CF_WORKERS_AI_TOKEN=QFygAQpOipm9V_ruUeqvRTWKUl5gioYmahkXTy0v
   ```
4. Save. The file is git-ignored, so the token stays local.

If the token ever changes, edit `.env.local` with the new value and save.

### 2. Define assets

`assets/ai/manifest.json` lists each asset with an id, category, prompt, model, and size. Add new entries to expand the library (e.g., new monster icons, UI glyphs, map textures).

### 3. Generate

Run:

```
npm run generate:ai          # generates every asset
npm run generate:ai -- --id=stone_floor_modular   # regenerate a single asset
```

Outputs are saved to `public/generated/<category>/<id>.png` and logged in `docs/TEXTURE_ASSETS.md`.

### 4. Integrate

Reference generated assets from React components or texture mapping files (`src/lib/dungeon-textures.ts`). Add any additional metadata (e.g., color palettes) as needed.

### 5. Runtime generation (optional)

Use `src/lib/workers-ai.ts` or the `/api/ai/generate-image` route to trigger Workers AI dynamically—for NPC portraits, monster art, etc. Ensure requests stay server-side so the API token is never exposed to the client.

