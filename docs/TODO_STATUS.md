# Isekai Project TODO Status

## User Tasks (Pending)
- [ ] **Auth Methods**: Choose auth methods (email magic link + Passkeys default) and optional OAuth keys
- [ ] **Admin Emails**: Provide initial admin DM emails to whitelist
- [ ] **LLM API Key**: Provide LLM API key (OpenRouter/OpenAI/Anthropic) or confirm offline-only for now
- [ ] **Android Setup**: Install Android Studio/SDK and decide app ID, app name; provide keystore or let me generate
- [ ] **Branding**: Provide app name/slug, logo/icon assets, color palette (or say choose for me)
- [ ] **Typography**: Approve fonts (or say choose for me)
- [ ] **Legal**: Approve privacy policy and terms (or let me template)
- [ ] **Domain**: Provide domain (optional) and DNS access if using custom domain now
- [ ] **Push Notifications**: Decide on push notifications now or later; provide FCM/VAPID keys if now
- [ ] **Seed Content**: Provide initial seed prompt, house rules, style guide preferences

## Assistant Tasks

### Completed ✅
- [x] **Fonts/Colors**: Select and apply default fonts/colors with source links
- [x] **Database Schema**: Prepare and apply DB schema and RLS policies for Supabase
- [x] **Views/RPCs**: Prepare player-safe views/RPCs and Realtime channels
- [x] **Scaffold**: Scaffold PWA/Next.js app with Tailwind/Radix and Capacitor
- [x] **CI/CD**: Set up GitHub Actions for Cloudflare Pages deploy (free) and bind env vars
- [x] **Auth/Campaigns**: Switch campaign creation to SECURITY DEFINER RPC to bypass RLS edge-cases

### In Progress 🔄
- [ ] **Entity CRUD**: Implement basic Entities CRUD and campaign detail page; seed graph later

### Pending 📋
- [ ] **ML Integration**: Implement RAG + generators v1 with client embeddings + server fallback
- [ ] **Export**: Implement PDF export and storage integration
- [ ] **Graph UI**: Implement graph visualization (Cytoscape.js)
- [ ] **Timeline**: Implement timeline/session history (vis-timeline)
- [ ] **Android**: Set up Capacitor Android build
- [ ] **Search**: Implement hybrid search (BM25 + vector + rerank)

## Current Priority
1. **Immediate**: Add `create_entity` RPC to Supabase
2. **Next**: Test entity creation functionality
3. **Then**: Implement graph visualization
4. **After**: Add ML content generation

## Blocked Items
- Entity creation (waiting for RPC)
- ML features (waiting for API key decision)
- Android app (waiting for Android Studio setup)

## Notes
- All core infrastructure is complete
- Authentication and campaign management working
- Ready for content generation and visualization features
- User can continue development on new computer with just environment variables
