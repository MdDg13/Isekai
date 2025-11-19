# Texture Assets

Dungeon textures are procedurally generated SVG patterns (see `src/lib/dungeon-textures.ts`) with palettes tuned per dungeon type. This keeps the bundle small while giving each environment its own character (caves are earthy, temples are warm stone, lairs are mossy, etc.).

When higher fidelity is needed:

1. Generate seamless textures (e.g. via Midjourney/SDXL or public domain packs).
2. Export them as optimized SVG/PNG tiles no larger than 256×256.
3. Store assets under `public/textures/<type>/`.
4. Reference them inside `generateTexturePatterns` or new pattern helpers.
5. Document the source/license here.

Current palette mapping covers:

| Type      | Floor Palette       | Wall Palette        |
|-----------|---------------------|---------------------|
| Dungeon   | Cold slate stone    | Midnight granite    |
| Cave      | Earthy clay         | Dark basalt         |
| Ruin      | Weathered sandstone | Cracked marble      |
| Fortress  | Blue-gray steelite  | Reinforced stone    |
| Tower     | Twilight obsidian   | Arcane marble       |
| Temple    | Warm jade/marble    | Regal rose-stone    |
| Lair      | Mossy loam          | Swampstone          |

Update this table as new assets are added.

