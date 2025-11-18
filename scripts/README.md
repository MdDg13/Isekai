# Scripts Directory

This directory contains operational scripts organized by purpose.

## Structure

- **`data-extraction/`** - Scripts for extracting and processing content from PDFs, markdown, and other sources
- **`database/`** - Scripts for database operations (backup, restore, population, analysis)
- **`utilities/`** - General utility scripts (git helpers, log checking, validation)
- **`legacy/`** - Deprecated scripts kept for reference

## Usage

Most scripts require environment variables set in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (for database operations)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (for client operations)

See individual script headers for specific requirements.
