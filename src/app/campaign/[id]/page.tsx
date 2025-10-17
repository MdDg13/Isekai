"use client";

import { createClient } from "@supabase/supabase-js";
import { useMemo, useState, useEffect } from "react";
import { useParams } from "next/navigation";

// This is required for static export with dynamic routes
export async function generateStaticParams() {
  return [];
}

export default function CampaignPage() {
  const params = useParams();
  const campaignId = params.id as string;

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
  const [entities, setEntities] = useState<{ id: string; type: string; title: string; summary: string; created_at: string }[]>([]);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEntity, setNewEntity] = useState({ type: 'npc', title: '', summary: '' });
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    if (!supabase) return;
    
    // Check auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Load campaign and entities
    loadCampaign();
    loadEntities();
  }, [supabase, campaignId]);

  const loadCampaign = async () => {
    if (!supabase) return;
    
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();
    
    if (error) {
      console.error('Error loading campaign:', error);
      setStatus(`Error loading campaign: ${error.message}`);
    } else {
      setCampaign(data);
    }
  };

  const loadEntities = async () => {
    if (!supabase) return;
    
    const { data, error } = await supabase
      .from('entities')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error loading entities:', error);
      setStatus(`Error loading entities: ${error.message}`);
    } else {
      setEntities(data || []);
    }
  };

  const createEntity = async () => {
    if (!newEntity.title.trim() || !supabase) return;
    
    setStatus("Creating entity...");
    
    const { error } = await supabase.rpc('create_entity', {
      p_campaign_id: campaignId,
      p_type: newEntity.type,
      p_title: newEntity.title.trim(),
      p_summary: newEntity.summary.trim(),
    });

    if (error) {
      setStatus(`Error creating entity: ${error.message}`);
    } else {
      setStatus("Entity created!");
      setNewEntity({ type: 'npc', title: '', summary: '' });
      setShowCreateForm(false);
      loadEntities();
    }
  };

  if (!campaign) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <header className="mb-8">
        <h1 className="font-display text-3xl">{campaign.name}</h1>
        <p className="text-sm text-[var(--color-muted)]">Campaign created {new Date(campaign.created_at).toLocaleDateString()}</p>
      </header>

      <div className="space-y-6">
        {/* Entities Section */}
        <div className="rounded-lg border border-[var(--color-border)] bg-black/20 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Entities</h2>
            <button
              onClick={() => setShowCreateForm(true)}
              className="rounded-md bg-[var(--color-primary)] px-3 py-1 text-sm font-medium text-white hover:bg-[var(--primary-hover)]"
            >
              Add Entity
            </button>
          </div>
          
          {entities.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">No entities yet. Add your first NPC, location, or item!</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {entities.map((entity) => (
                <div key={entity.id} className="rounded border border-[var(--color-border)] p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-[var(--color-primary)] text-white px-2 py-1 rounded uppercase">
                      {entity.type}
                    </span>
                  </div>
                  <h3 className="font-medium">{entity.title}</h3>
                  {entity.summary && (
                    <p className="text-sm text-[var(--color-muted)] mt-1">{entity.summary}</p>
                  )}
                  <p className="text-xs text-[var(--color-muted)] mt-2">
                    Created {new Date(entity.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Entity Form */}
        {showCreateForm && (
          <div className="rounded-lg border border-[var(--color-border)] bg-black/20 p-4">
            <h3 className="text-lg font-medium mb-4">Add New Entity</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Type</label>
                <select
                  className="w-full rounded-md border border-[var(--color-border)] bg-transparent p-2 outline-none"
                  value={newEntity.type}
                  onChange={(e) => setNewEntity({ ...newEntity, type: e.target.value })}
                >
                  <option value="npc">NPC</option>
                  <option value="location">Location</option>
                  <option value="item">Item</option>
                  <option value="faction">Faction</option>
                  <option value="lore">Lore</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm mb-1">Title</label>
                <input
                  className="w-full rounded-md border border-[var(--color-border)] bg-transparent p-2 outline-none"
                  type="text"
                  placeholder="Entity name"
                  value={newEntity.title}
                  onChange={(e) => setNewEntity({ ...newEntity, title: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm mb-1">Summary</label>
                <textarea
                  className="w-full rounded-md border border-[var(--color-border)] bg-transparent p-2 outline-none"
                  rows={3}
                  placeholder="Brief description"
                  value={newEntity.summary}
                  onChange={(e) => setNewEntity({ ...newEntity, summary: e.target.value })}
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <button
                onClick={createEntity}
                className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-hover)]"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setNewEntity({ type: 'npc', title: '', summary: '' });
                }}
                className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {status && <p className="text-sm">{status}</p>}
      </div>
    </div>
  );
}
