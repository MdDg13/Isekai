# Isekai Project Migration Guide

## Quick Setup on New Computer

### 1. Prerequisites
- Install Node.js v20+ from https://nodejs.org/
- Install Cursor IDE
- Access to your accounts (GitHub, Supabase, Cloudflare)

### 2. Clone Repository
```bash
git clone https://github.com/MdDg13/Isekai.git
cd Isekai
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Environment Variables

#### Local Development
Create `.env.local` file in project root:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xblkaezmfdhchndhkjsv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[get from Supabase dashboard]
```

**To get Supabase keys:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy "Project URL" and "anon public" key

#### GitHub Repository Variables (REQUIRED for deployments)
**CRITICAL**: For static export, `NEXT_PUBLIC_*` variables must be set in GitHub repository variables because they're needed at BUILD TIME.

1. Go to: `https://github.com/MdDg13/Isekai/settings/variables/actions`
2. Click "New repository variable"
3. Add:
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://xblkaezmfdhchndhkjsv.supabase.co`
4. Click "New repository variable" again
5. Add:
   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: (copy from Supabase dashboard - the "anon public" key)

**Why repository variables?** Since these are `NEXT_PUBLIC_*` variables (embedded in client bundle), they can be stored as repository variables (not secrets). They're required at build time for static export to work correctly.

### 5. Test Setup
```bash
npm run dev
```
Visit http://localhost:3000 and test:
- Sign in with your email
- Create a test campaign
- Verify everything works

### 6. Production Build Test
```bash
npm run build
```

## Account Access Required
- **GitHub**: alexpeck@hotmail.com (already connected)
- **Supabase**: Project at xblkaezmfdhchndhkjsv.supabase.co
- **Cloudflare**: Pages project "isekai" (domain: isekai-f2i.pages.dev)

## What's Already Configured
- ✅ GitHub repository with all code
- ✅ Supabase database with complete schema
- ✅ Cloudflare Pages deployment
- ✅ GitHub Actions CI/CD pipeline
- ✅ Authentication system
- ✅ Campaign management
- ✅ Entity creation system

## Troubleshooting
- If build fails: Check Node.js version (needs v20+)
- If Supabase errors: Verify environment variables
- If deployment fails: Check GitHub Actions logs

## Next Steps After Migration
1. Test all functionality
2. Continue development from current state
3. Reference PROJECT_HISTORY.md for context
4. Check TODO_STATUS.md for pending tasks
