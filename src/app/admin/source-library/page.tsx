'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

interface SourceSnippet {
  id: string;
  source_name: string;
  excerpt: string;
  tags?: string[];
  archetype?: string;
  conflict_hook?: string;
  rp_cues?: string[];
  culture?: string;
  biome?: string;
  tone?: string;
  quality_score?: number;
}

export default function SourceLibraryPage() {
  const [snippets, setSnippets] = useState<SourceSnippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    tags: '',
    culture: '',
    biome: '',
    tone: '',
    minQuality: '80'
  });

  useEffect(() => {
    loadSnippets();
  }, []);

  async function loadSnippets() {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase not configured');
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      const query = supabase
        .from('source_snippet')
        .select('*')
        .order('quality_score', { ascending: false })
        .limit(100);

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;
      setSnippets(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function applyFilters() {
    setLoading(true);
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase not configured');
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      let query = supabase
        .from('source_snippet')
        .select('*')
        .gte('quality_score', parseFloat(filters.minQuality) || 80)
        .order('quality_score', { ascending: false })
        .limit(100);

      if (filters.culture) {
        query = query.eq('culture', filters.culture);
      }
      if (filters.biome) {
        query = query.eq('biome', filters.biome);
      }
      if (filters.tone) {
        query = query.eq('tone', filters.tone);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      // Filter by tags in memory (Supabase array contains is complex)
      let filtered = data || [];
      if (filters.tags) {
        const tagList = filters.tags.split(',').map(t => t.trim().toLowerCase());
        filtered = filtered.filter(s => 
          s.tags?.some((tag: string) => tagList.some(ft => tag.toLowerCase().includes(ft)))
        );
      }

      setSnippets(filtered);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const uniqueCultures = [...new Set(snippets.map(s => s.culture).filter(Boolean))];
  const uniqueBiomes = [...new Set(snippets.map(s => s.biome).filter(Boolean))];
  const uniqueTones = [...new Set(snippets.map(s => s.tone).filter(Boolean))];

  return (
    <div className="w-full px-4 sm:px-6 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href="/settings" className="text-blue-400 hover:text-blue-300 text-sm">
            ← Back to Settings
          </Link>
          <h1 className="text-3xl font-bold mt-2">Source Library</h1>
          <p className="text-gray-400 mt-1">Browse and manage source snippets for world generation</p>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Tags (comma-separated)</label>
              <input
                type="text"
                value={filters.tags}
                onChange={(e) => setFilters({ ...filters, tags: e.target.value })}
                className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm"
                placeholder="npc, wizard"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Culture</label>
              <select
                value={filters.culture}
                onChange={(e) => setFilters({ ...filters, culture: e.target.value })}
                className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm"
              >
                <option value="">All</option>
                {uniqueCultures.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Biome</label>
              <select
                value={filters.biome}
                onChange={(e) => setFilters({ ...filters, biome: e.target.value })}
                className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm"
              >
                <option value="">All</option>
                {uniqueBiomes.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Tone</label>
              <select
                value={filters.tone}
                onChange={(e) => setFilters({ ...filters, tone: e.target.value })}
                className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm"
              >
                <option value="">All</option>
                {uniqueTones.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Min Quality</label>
              <input
                type="number"
                value={filters.minQuality}
                onChange={(e) => setFilters({ ...filters, minQuality: e.target.value })}
                className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm"
                min="0"
                max="100"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={applyFilters}
                className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading && <div className="text-center py-8">Loading...</div>}
        {error && <div className="text-red-400 py-4">Error: {error}</div>}
        
        {!loading && !error && (
          <>
            <div className="mb-4 text-sm text-gray-400">
              Showing {snippets.length} snippets
            </div>
            
            <div className="space-y-4">
              {snippets.map((snippet) => (
                <div key={snippet.id} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold text-lg">{snippet.source_name}</div>
                      {snippet.archetype && (
                        <div className="text-sm text-gray-400">Archetype: {snippet.archetype}</div>
                      )}
                    </div>
                    <div className="text-sm text-gray-400">
                      Quality: {snippet.quality_score || 0}
                    </div>
                  </div>
                  
                  <p className="text-gray-300 mb-3">{snippet.excerpt}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-2">
                    {snippet.tags?.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-gray-700 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-400">
                    {snippet.culture && <div>Culture: {snippet.culture}</div>}
                    {snippet.biome && <div>Biome: {snippet.biome}</div>}
                    {snippet.tone && <div>Tone: {snippet.tone}</div>}
                  </div>
                  
                  {snippet.conflict_hook && (
                    <div className="mt-2 text-sm">
                      <span className="text-gray-400">Conflict: </span>
                      <span className="text-gray-300">{snippet.conflict_hook}</span>
                    </div>
                  )}
                  
                  {snippet.rp_cues && snippet.rp_cues.length > 0 && (
                    <div className="mt-2 text-sm">
                      <span className="text-gray-400">RP Cues: </span>
                      <span className="text-gray-300">{snippet.rp_cues.join(', ')}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

