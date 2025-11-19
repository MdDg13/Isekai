### Texture Assets

The dungeon renderer currently uses procedurally generated SVG patterns defined in `src/lib/dungeon-textures.ts`.  
Each dungeon type (cave, ruin, fortress, etc.) has a dedicated palette for floors and walls so the visuals feel distinct without relying on large bitmap files.

When adding external assets (AI-generated or downloaded), store optimized versions in this directory and update the palette definitions to point at the new resources. Keep sources and licensing details documented in `docs/TEXTURE_ASSETS.md`.

