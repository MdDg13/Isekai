# Isekai Project Roadmap

Single-source plan covering functional scope, UI/UX improvements, and technical delivery. Updated 2025‑11‑19.

---

## 1. Platform Baseline

| Area | Details |
| --- | --- |
| Core stack | Next.js **15.5.4** (App Router, `output: 'export'`), React **19.1.0**, TypeScript (strict), Tailwind CSS |
| Deployment | Static export → Cloudflare Pages, functions in `functions/` (Cloudflare Workers) |
| Backend | Supabase (Row Level Security, RPCs), accessed via `@supabase/supabase-js` |
| Theming | CSS custom properties (`globals.css`), `ThemeProvider` for light/dark, new shared map palette (`src/lib/theme/map-theme.ts`) |
| Testing | ESLint, TypeScript (`npx tsc --noEmit`), Vitest, Playwright (E2E) |

---

## 2. Functional Scope Overview

1. **Dungeon Generator**
   - Procedural generation (BSP + MST), tile-based option.
   - Parameters: size presets, difficulty, room/corridor density, AI assist.
   - Visualization: SVG map with textures, DM/Player modes, export.
2. **World Dashboard**
   - Tabs for NPCs, locations, dungeons.
   - Integrates Supabase content graph (`world_element`, `element_link`).
3. **Future Modules**
   - Map/location creation with AI assistance.
   - Encounter/travel integration (via docs in `docs/`).

---

## 3. UI/UX Roadmap

### Phase 1 – In Progress (Current Sprint)
- Theme tokens + shared components so dungeon + future map tools inherit consistent styling.
- Loading states (progress bar, skeleton), toast notifications, validation badges.
- Stats panel showing estimated rooms/area; contextual tooltips for advanced parameters.

### Phase 2 – Next Sprint
- Export drawer (PNG/SVG/PDF/JSON), DM/Player presets.
- Generation history rail + quick regenerate.
- Keyboard navigation + accessibility audit (ARIA labels, focus traps).
- Enhanced tooltips with example thumbnails; live parameter preview.

### Phase 3 – Post-MVP
- Manual editing mode (drag rooms, add doors/features).
- Preset templates + custom preset save/load.
- Collaboration + annotations; VTT export (Foundry, Roll20).
- AI enhancements (room descriptions, encounter suggestions).

Reference document: `docs/DUNGEON_UX_RECOMMENDATIONS.md`.

---

## 4. Technical Delivery Schedule

| Week | Focus | Key Deliverables |
| --- | --- | --- |
| 45 (current) | Theme system & UX foundations | Shared map palette ✅, size presets ✅, delete feature ✅, loading/validation groundwork |
| 46 | Feedback & parameter revamp | Toast notifications, progress bar, stats panel, tabbed layout |
| 47 | Map workspace upgrade | Layer panel, export drawer, zoom/pan, legend |
| 48 | Dungeon library & accessibility | Card redesign, filters, accessible delete modal, keyboard nav, responsive tweaks |
| 49+ | Advanced editing & integration | Manual edits, presets, VTT export planning, AI hooks |

Schedule aligns with Cloudflare deploy cadence (daily) and Supabase schema stability (enum already extended for `dungeon`).

---

## 5. Dependencies & Risks

- **Supabase RPCs**: ensure world/dungeon insert/delete flows stay in sync with `functions/api/generate-dungeon.ts`.
- **Static Export**: avoid introducing non-static features; use Cloudflare functions for dynamic needs.
- **Texture Asset Complexity**: current SVG patterns lightweight; monitor performance when adding layers or gradients.
- **Manual Editing**: future feature may require client-side state management (consider Zustand) and persistence endpoints.

---

## 6. Next Steps (Actionable)

1. **Implement loading/progress system** in dungeon generator UI (Phase 1).
2. **Add stats panel** summarizing estimated rooms/footprint using new size presets.
3. **Introduce toast notifications** (success/error) replacing inline status text.
4. **Start export drawer design** aligned with theme tokens (prep for Phase 2).
5. **Document any new tokens/components** in `docs/PROJECT_ROADMAP.md` + `docs/DUNGEON_UX_RECOMMENDATIONS.md` as they land.

Ready to proceed with Phase 1 implementation tasks above.

