"use client";

import { createClient } from "@supabase/supabase-js";
import { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface CampaignClientProps {
  campaignId: string;
}

export default function CampaignClient({ campaignId }: CampaignClientProps) {
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      console.warn('Supabase environment variables not found');
      return null;
    }
    return createClient(url, key);
  }, []);

  const [campaign, setCampaign] = useState<{ id: string; name: string; created_at: string } | null>(null);
  const [npcs, setNpcs] = useState<Array<{
    id: string;
    name: string;
    created_at: string;
    bio?: string;
    backstory?: string;
    traits?: unknown;
    stats?: unknown;
    location_id?: string | null;
    affiliations?: unknown;
  }>>([]);
  const [, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [status, setStatus] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'arcs' | 'encounters' | 'characters' | 'sessions' | 'npcs'>('arcs');

  const loadCampaign = useCallback(async () => {
    if (!supabase) return;
    
    const { data, error } = await supabase
      .from('campaign')
      .select('*')
      .eq('id', campaignId)
      .single();
    
    if (error) {
      console.error('Error loading campaign:', error);
      setStatus(`Error loading campaign: ${error.message}`);
    } else {
      setCampaign(data);
    }
  }, [supabase, campaignId]);

  const loadNpcs = useCallback(async () => {
    if (!supabase) return;
    // Load campaign-specific NPCs (not world NPCs)
    const { data, error } = await supabase
      .from('campaign_npc')
      .select('id,name,created_at,bio,backstory,traits,stats,location_id,affiliations')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error loading campaign NPCs:', error);
    } else {
      setNpcs(data || []);
    }
  }, [supabase, campaignId]);

  useEffect(() => {
    if (!supabase) return;
    
    // Check auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Load campaign and NPCs
    loadCampaign();
    loadNpcs();
  }, [supabase, campaignId, loadCampaign, loadNpcs]);

  if (!campaign) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading campaign...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm border-b border-gray-800">
        <div className="w-full px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-300">← Back to Worlds</Link>
            <div className="flex items-center gap-3">
              <button onClick={loadNpcs} className="text-xs text-gray-400 hover:text-gray-300">Refresh</button>
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-medium">{campaign.name}</h1>
          <p className="text-xs text-gray-400 mt-1">Created {new Date(campaign.created_at).toLocaleDateString()}</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-800 bg-gray-900/30">
        <div className="w-full px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('arcs')}
              className={`px-4 py-3 text-sm font-medium transition-colors touch-manipulation whitespace-nowrap ${
                activeTab === 'arcs'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Story Arcs
            </button>
            <button
              onClick={() => setActiveTab('encounters')}
              className={`px-4 py-3 text-sm font-medium transition-colors touch-manipulation whitespace-nowrap ${
                activeTab === 'encounters'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Encounters
            </button>
            <button
              onClick={() => setActiveTab('characters')}
              className={`px-4 py-3 text-sm font-medium transition-colors touch-manipulation whitespace-nowrap ${
                activeTab === 'characters'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Characters
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-4 py-3 text-sm font-medium transition-colors touch-manipulation whitespace-nowrap ${
                activeTab === 'sessions'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Sessions
            </button>
            <button
              onClick={() => setActiveTab('npcs')}
              className={`px-4 py-3 text-sm font-medium transition-colors touch-manipulation whitespace-nowrap ${
                activeTab === 'npcs'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Campaign NPCs ({npcs.length})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full px-4 sm:px-6 py-6">
        {activeTab === 'arcs' && (
          <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-8 text-center">
            <p className="text-gray-400">Story Arcs feature coming soon</p>
            <p className="text-xs text-gray-500 mt-2">Track your campaign&apos;s story arcs and beats here</p>
          </div>
        )}

        {activeTab === 'encounters' && (
          <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-8 text-center">
            <p className="text-gray-400">Encounters feature coming soon</p>
            <p className="text-xs text-gray-500 mt-2">Plan and run combat encounters here</p>
          </div>
        )}

        {activeTab === 'characters' && (
          <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-8 text-center">
            <p className="text-gray-400">Player Characters feature coming soon</p>
            <p className="text-xs text-gray-500 mt-2">Manage player characters in this campaign</p>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-8 text-center">
            <p className="text-gray-400">Sessions feature coming soon</p>
            <p className="text-xs text-gray-500 mt-2">Track session logs and notes here</p>
          </div>
        )}

        {activeTab === 'npcs' && (
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4 mb-4">
              <p className="text-sm text-gray-400">
                <span className="font-medium">Note:</span> World-level NPCs are managed in the World page. 
                These are campaign-specific NPCs created for this particular game.
              </p>
            </div>
            {npcs.length === 0 ? (
              <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-8 text-center">
                <p className="text-gray-400">No campaign-specific NPCs yet.</p>
                <p className="text-xs text-gray-500 mt-2">Campaign NPCs are different from world NPCs and are specific to this game.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {npcs.map(n => {
                  const traits = n.traits as { race?: string; temperament?: string; keywords?: string[] } | undefined;
                  const stats = n.stats as { level?: number; abilities?: Record<string, number> } | undefined;
                  return (
                    <div key={n.id} className="rounded-lg border border-gray-800 bg-gray-900/50 p-4 hover:bg-gray-900/70 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-base">{n.name}</h3>
                        {stats?.level && (
                          <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Lv {stats.level}</span>
                        )}
                      </div>
                      {traits?.race && (
                        <p className="text-xs text-gray-400 mb-2">
                          {traits.race} {traits.temperament ? `• ${traits.temperament}` : ''}
                        </p>
                      )}
                      {n.bio && (
                        <p className="text-sm text-gray-300 mt-2 line-clamp-3">{n.bio}</p>
                      )}
                      {traits?.keywords && traits.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {traits.keywords.slice(0, 3).map((kw, i) => (
                            <span key={i} className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded">
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-3">Created {new Date(n.created_at).toLocaleDateString()}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {status && (
          <div className={`rounded-lg border p-4 mt-4 ${
            status.includes('failed') || status.includes('Error')
              ? 'border-red-800 bg-red-900/20 text-red-300'
              : 'border-blue-800 bg-blue-900/20 text-blue-300'
          }`}>
            <p className="text-sm">{status}</p>
          </div>
        )}
      </div>
    </div>
  );
}
