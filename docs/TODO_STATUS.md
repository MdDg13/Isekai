# Isekai Project TODO Status

## Owner Tasks (Pending Input)
- [ ] **Brand Identity**: Finalize logo/icon assets and typography preferences (defaults in place, waiting on confirmation)
- [ ] **Policy Docs**: Approve privacy & terms drafts (templates pending decision)
- [ ] **Domain**: Decide whether to map custom domain or continue using `isekai-f2i.pages.dev`
- [ ] **Android Rollout**: Provide keystore + app id (for future Capacitor build)
- [ ] **NPC Feedback Loop**: Supply curated prompts/examples highlighting desired tone for further tuning

## Assistant Tasks

### Completed ✅
- [x] **Fonts/Colors**: Select and apply default fonts/colors with source links
- [x] **Database Schema**: Prepare and apply DB schema and RLS policies for Supabase
- [x] **Views/RPCs**: Prepare player-safe views/RPCs and Realtime channels
- [x] **Scaffold**: Scaffold PWA/Next.js app with Tailwind/Radix and Capacitor
- [x] **CI/CD**: Set up GitHub Actions for Cloudflare Pages deploy (free) and bind env vars
- [x] **Auth/Campaigns**: Switch campaign creation to SECURITY DEFINER RPC to bypass RLS edge-cases
- [x] **World NPC UX**: Add list/detail toggle, selection, bulk delete, stay-on-generator preference
- [x] **AI Pipeline**: Implement multi-pass Workers AI enhancement with critique, style, grammar, QA
- [x] **Git Guardrails**: Document & enforce safe git patterns (`.cursorrules`, validation script)
- [x] **Deployment Observability**: Improve wrangler logging + `check-logs.ps1`

### In Progress 🔄
- [ ] **NPC Prompt Tuning**: Improve adherence to explicit class/race cues and combat stat completeness

### Pending 📋
- [ ] **Location/Item Generation**: Port NPC pipeline to other entity types
- [ ] **Graph UI**: Implement world/campaign relationship visualization (Cytoscape.js)
- [ ] **Timeline**: Implement session history view (vis-timeline)
- [ ] **Export**: Add PDF/export tooling for world briefs
- [ ] **Android**: Set up Capacitor Android build
- [ ] **Search**: Implement hybrid search (BM25 + vector + rerank)
- [ ] **Passkey Auth**: Add optional passkey support alongside magic links

## Current Priority
1. **Immediate**: Gather feedback on keyword-driven NPC generation and adjust prompts
2. **Next**: Generalize AI pipeline for locations/items tabs
3. **Then**: Prototype graph visualization for entity relationships
4. **After**: Build timeline/session history module

## Blocked Items
- Advanced ML features (waiting on additional prompt datasets/owner guidance)
- Android wrapper (waiting on keystore + app id)
- Custom domain work (waiting on DNS decision)

## Notes
- Core infrastructure (auth, worlds, NPCs, deployments) is live
- NPC generator uses Cloudflare Workers AI; ensure `WORKERS_AI_ENABLE` env var is set
- Running `npm run analyze-npcs` surfaces AI quality issues quickly
- Follow `.cursorrules` for all git commands to avoid Cursor terminal hangs
