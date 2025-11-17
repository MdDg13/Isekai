'use client';

import { useState, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

interface ReferenceListItem {
  id?: string;
  name?: string;
  source?: string;
  kind?: string;
  rarity?: string;
  category?: string;
  cost_gp?: number;
  description?: string;
  level?: number;
  school?: string;
  casting_time?: string;
  range?: string;
  type?: string;
  size?: string;
  challenge_rating?: number;
  armor_class?: number;
  hit_points?: number;
  hit_dice?: string;
  speed?: number | string;
  [key: string]: unknown;
}

export default function ReferenceLibraryPage() {
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
  }, []);

  const [activeTab, setActiveTab] = useState<'items' | 'spells' | 'monsters' | 'classes' | 'races' | 'backgrounds' | 'feats'>('items');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ReferenceListItem[]>([]);

  const handleSearch = async () => {
    if (!supabase || !searchQuery.trim()) return;

    setLoading(true);
    try {
      let query = supabase.from(`reference_${activeTab}`).select('*').limit(50);

      if (searchQuery.trim()) {
        query = query.ilike('name', `%${searchQuery.trim()}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Search error:', error);
        setResults([]);
      } else {
        setResults((data as ReferenceListItem[]) || []);
      }
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'items' as const, label: 'Items' },
    { id: 'spells' as const, label: 'Spells' },
    { id: 'monsters' as const, label: 'Monsters' },
    { id: 'classes' as const, label: 'Classes' },
    { id: 'races' as const, label: 'Races' },
    { id: 'backgrounds' as const, label: 'Backgrounds' },
    { id: 'feats' as const, label: 'Feats' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8">
      <div className="w-full max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-4xl font-bold">Free5e Reference Library</h1>
        </div>
        <p className="text-gray-400 mb-8">
          Browse and search Free5e game content (Creative Commons Attribution 4.0)
        </p>

        {/* Search Bar */}
        <div className="mb-6 flex gap-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={`Search ${activeTab}...`}
            className="flex-1 px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setResults([]);
                setSearchQuery('');
              }}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-500 text-blue-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">
              Found {results.length} result{results.length !== 1 ? 's' : ''}
            </p>
            <div className="grid gap-4">
              {results.map((item, idx) => (
                <Link
                  key={idx}
                  href={`/reference/${activeTab}/${item.id}`}
                  className="block p-4 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-700 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">{String(item.name ?? 'Unknown')}</h3>
                      {activeTab === 'items' && (
                        <div className="text-sm text-gray-400 space-y-1">
                          {item.kind && <div>Kind: {String(item.kind)}</div>}
                          {item.rarity && <div>Rarity: {String(item.rarity)}</div>}
                          {typeof item.cost_gp === 'number' ? <div>Cost: {item.cost_gp} gp</div> : null}
                          {item.description && (
                            <p className="mt-2 text-gray-300 line-clamp-2">{String(item.description)}</p>
                          )}
                        </div>
                      )}
                      {activeTab === 'spells' && (
                        <div className="text-sm text-gray-400 space-y-1">
                          {typeof item.level === 'number' ? <div>Level: {item.level === 0 ? 'Cantrip' : item.level}</div> : null}
                          {item.school && <div>School: {String(item.school)}</div>}
                          {item.casting_time && <div>Casting Time: {String(item.casting_time)}</div>}
                          {item.range && <div>Range: {String(item.range)}</div>}
                          {item.description && (
                            <p className="mt-2 text-gray-300 line-clamp-2">{String(item.description)}</p>
                          )}
                        </div>
                      )}
                      {activeTab === 'monsters' && (
                        <div className="text-sm text-gray-400 space-y-1">
                          {item.type && <div>Type: {String(item.type)}</div>}
                          {item.size && <div>Size: {String(item.size)}</div>}
                          {typeof item.challenge_rating === 'number' ? <div>CR: {item.challenge_rating}</div> : null}
                          {typeof item.armor_class === 'number' ? <div>AC: {item.armor_class}</div> : null}
                          {typeof item.hit_points === 'number' ? <div>HP: {item.hit_points}</div> : null}
                        </div>
                      )}
                      {activeTab === 'classes' && (
                        <div className="text-sm text-gray-400 space-y-1">
                          {item.hit_dice && <div>Hit Dice: {String(item.hit_dice)}</div>}
                        </div>
                      )}
                      {activeTab === 'races' && (
                        <div className="text-sm text-gray-400 space-y-1">
                          {item.size && <div>Size: {String(item.size)}</div>}
                          {typeof item.speed === 'number' ? <div>Speed: {item.speed} ft</div> : null}
                        </div>
                      )}
                    </div>
                    <div className="ml-4 text-xs text-gray-500">
                      {item.source && <div>Source: {String(item.source)}</div>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {results.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-400">
            <p>Enter a search query and click Search to find {activeTab}</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-12 text-gray-400">
            <p>Searching...</p>
          </div>
        )}
      </div>
    </div>
  );
}

