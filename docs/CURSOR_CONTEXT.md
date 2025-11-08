# Isekai Development Context for Cursor

## Project Summary
Isekai is a D&D world-building app built with Next.js + Supabase. It's a PWA that will also run on Android via Capacitor.

## Current State
- ✅ Authentication system (magic links)
- ✅ Campaign management
- ✅ Entity creation forms
- 🔄 Adding `create_entity` RPC to Supabase
- 🔄 Testing entity creation

## Key Files
- `src/app/page.tsx` - Main landing page with auth and campaign list
- `src/app/campaign/[id]/page.tsx` - Campaign detail page (server component)
- `src/app/campaign/[id]/campaign-client.tsx` - Campaign detail client component
- `next.config.mjs` - Static export configuration
- `.github/workflows/deploy.yml` - Cloudflare Pages deployment

## Database
- **Supabase Project**: xblkaezmfdhchndhkjsv.supabase.co
- **Tables**: campaigns, campaign_members, entities, edges, sessions, revisions
- **RPC Functions**: create_campaign_with_dm, create_entity (pending)

## Cloudflare Pages
- **Project Name**: `isekai` (used in API calls and deployment commands)
- **Domain**: `isekai-f2i.pages.dev` (the actual site URL)
- **Note**: Use project name `isekai` in all API calls and deployment commands, not the domain.

## Environment Variables Needed
```env
NEXT_PUBLIC_SUPABASE_URL=https://xblkaezmfdhchndhkjsv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[get from Supabase dashboard]
```

## Current Issue
The `create_entity` RPC function needs to be added to Supabase. The client code calls:
```typescript
supabase.rpc('create_entity', {
  p_campaign_id: campaignId,
  p_type: newEntity.type,
  p_title: newEntity.title.trim(),
  p_summary: newEntity.summary.trim(),
})
```

## Next Steps
1. Add `create_entity` RPC to Supabase
2. Test entity creation
3. Implement graph visualization
4. Add ML content generation

## User Info
- **Email**: alexpeck@hotmail.com
- **GitHub**: MdDg13
- **Project**: Private repo, public deployment

## Architecture Decisions
- Cloudflare Pages (free) over Vercel (paid team collaboration)
- Supabase for integrated backend
- Static export with dynamic routes
- Client-side ML embeddings + server fallback
