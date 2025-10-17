# Isekai Project History & Context

## Project Overview
**Isekai** is a cross-platform D&D world-building app that runs in browsers and on Android. It uses ML for content generation and provides collaborative campaign management.

## Core Features
1. **Campaign Structure**: Create and manage D&D campaigns with world-building
2. **Session Management**: Track sessions/missions with interconnected story elements
3. **Content Generation**: AI-powered NPCs, locations, items, and events
4. **Multi-user Support**: DM and player roles with different access levels

## Technical Stack
- **Frontend**: Next.js 15 + React 18 + Tailwind CSS
- **Backend**: Supabase (Postgres + Auth + Storage)
- **Deployment**: Cloudflare Pages + GitHub Actions
- **Mobile**: Capacitor (for Android wrapper)
- **ML**: OpenRouter API + client-side embeddings
- **UI Components**: Radix UI + custom components

## Development Timeline

### Phase 1: Foundation (Completed)
- ✅ Set up GitHub repository
- ✅ Configured Cloudflare Pages deployment
- ✅ Set up Supabase project with schema
- ✅ Implemented authentication (magic links)
- ✅ Created campaign management system
- ✅ Built entity creation (NPCs, locations, items)

### Phase 2: Current State
- ✅ Campaign detail pages with entity lists
- ✅ Entity creation forms
- 🔄 Adding `create_entity` RPC to Supabase
- 🔄 Testing entity creation functionality

### Phase 3: Next Features (Pending)
- Graph visualization (Cytoscape.js)
- Timeline/session history (vis-timeline)
- ML content generation
- PDF export
- Android app wrapper

## Key Decisions Made
1. **Hosting**: Chose Cloudflare Pages over Vercel (free team collaboration)
2. **Database**: Supabase for integrated auth + database + storage
3. **Architecture**: PWA-first with Android wrapper via Capacitor
4. **Authentication**: Magic links + Passkeys (future)
5. **ML Strategy**: Client-side embeddings + server fallback

## Database Schema
```sql
-- Core tables
campaigns (id, name, slug, created_by, created_at)
campaign_members (campaign_id, user_id, role)
entities (id, campaign_id, type, title, summary, created_by, created_at)
edges (id, from_entity_id, to_entity_id, relationship_type)
sessions (id, campaign_id, title, summary, created_at)
revisions (id, entity_id, content, created_by, created_at)
```

## RPC Functions
- `create_campaign_with_dm(p_name, p_slug)` - Creates campaign + assigns DM
- `create_entity(p_campaign_id, p_type, p_title, p_summary)` - Creates entity safely

## Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=https://xblkaezmfdhchndhkjsv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon key]
```

## Current Issues Resolved
1. **RLS Errors**: Used SECURITY DEFINER RPC functions
2. **Build Errors**: Fixed static export with dynamic routes
3. **Deployment**: Configured GitHub Actions for Cloudflare Pages

## User Account
- **Primary Email**: alexpeck@hotmail.com
- **GitHub**: MdDg13
- **Supabase Project**: xblkaezmfdhchndhkjsv.supabase.co
- **Cloudflare Pages**: isekai-f2i.pages.dev
