## AI Asset Pipeline

This project can now auto-generate textures, portraits, icons, and other art using **Cloudflare Workers AI**.

### 1. Configure secrets

Create `.env.local` (Next.js) and add:

```
CF_ACCOUNT_ID=9b19a6844783aa1bc6a7ee3e978cfcad
CF_WORKERS_AI_TOKEN=<your-workers-ai-token>
```

Never commit the actual token to git.

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

