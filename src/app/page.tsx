"use client";

import { createClient } from "@supabase/supabase-js";
import { useMemo, useState, useEffect } from "react";

export default function Home() {
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      console.warn('Supabase environment variables not found');
      return null;
    }
    return createClient(url, key);
  }, []);

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string>("");
  const [diag, setDiag] = useState<string>("");
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [campaigns, setCampaigns] = useState<{ id: string; name: string; created_at: string }[]>([]);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const loadCampaigns = async () => {
    if (!supabase) return;
    
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error loading campaigns:', error);
      setStatus(`Error loading campaigns: ${error.message}`);
    } else {
      setCampaigns(data || []);
    }
  };

  useEffect(() => {
    if (!supabase) return;
    
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadCampaigns();
      }
    });

    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadCampaigns();
      } else {
        setCampaigns([]);
      }
    });
  }, [supabase]);

  const createCampaign = async () => {
    if (!newCampaignName.trim() || !user || !supabase) return;
    
    setStatus("Creating campaign...");
    const slug = newCampaignName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    const { data, error } = await supabase.rpc('create_campaign_with_dm', {
      p_name: newCampaignName.trim(),
      p_slug: slug,
    });

    if (error) {
      setStatus(`Error creating campaign: ${error.message}`);
    } else {
      setStatus("Campaign created!");
      setNewCampaignName("");
      setShowCreateForm(false);
      loadCampaigns();
    }
  };

  const onSignIn = async () => {
    if (!supabase) return;
    
    setStatus("Sending magic link...");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    setStatus(error ? `Error: ${error.message}` : "Check your email for a magic link.");
  };

  const onSignOut = async () => {
    if (!supabase) return;
    
    await supabase.auth.signOut();
    setUser(null);
    setCampaigns([]);
  };

  const onDiagnose = async () => {
    try {
      const url = (process.env.NEXT_PUBLIC_SUPABASE_URL as string) ?? "";
      const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string) ?? "";
      const res = await fetch(`${url}/auth/v1/settings`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      });
      setDiag(`GET /auth/v1/settings → ${res.status}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setDiag(`Diag error: ${message}`);
    }
  };

  return (
    <div className="mx-auto max-w-xl p-6">
      <header className="mb-8">
        <h1 className="font-display text-3xl">Isekai</h1>
        {user ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--color-muted)]">Welcome, {user.email || 'User'}</p>
            <button
              onClick={onSignOut}
              className="text-xs underline opacity-70"
            >
              Sign out
            </button>
          </div>
        ) : (
          <p className="text-sm text-[var(--color-muted)]">Sign in to get started.</p>
        )}
      </header>

      {user ? (
        <div className="space-y-4">
          {/* Campaign List */}
          <div className="rounded-lg border border-[var(--color-border)] bg-black/20 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">My Campaigns</h2>
              <button
                onClick={() => setShowCreateForm(true)}
                className="rounded-md bg-[var(--color-primary)] px-3 py-1 text-sm font-medium text-white hover:bg-[var(--primary-hover)]"
              >
                Create Campaign
              </button>
            </div>
            
            {campaigns.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">No campaigns yet. Create your first one!</p>
            ) : (
              <div className="space-y-2">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="rounded border border-[var(--color-border)] p-3">
                    <h3 className="font-medium">{campaign.name}</h3>
                    <p className="text-xs text-[var(--color-muted)]">Created {new Date(campaign.created_at).toLocaleDateString()}</p>
                    <a
                      href={`/campaign/${campaign.id}`}
                      className="mt-2 inline-block rounded-md bg-[var(--color-primary)] px-3 py-1 text-xs font-medium text-white hover:bg-[var(--primary-hover)]"
                    >
                      Open
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create Campaign Form */}
          {showCreateForm && (
            <div className="rounded-lg border border-[var(--color-border)] bg-black/20 p-4">
              <h3 className="text-lg font-medium mb-4">Create New Campaign</h3>
              <input
                className="w-full rounded-md border border-[var(--color-border)] bg-transparent p-2 outline-none mb-3"
                type="text"
                placeholder="Campaign name"
                value={newCampaignName}
                onChange={(e) => setNewCampaignName(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  onClick={createCampaign}
                  className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-hover)]"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewCampaignName("");
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
      ) : (
        <div className="rounded-lg border border-[var(--color-border)] bg-black/20 p-4">
          <label className="mb-2 block text-sm">Email</label>
          <input
            className="w-full rounded-md border border-[var(--color-border)] bg-transparent p-2 outline-none"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            onClick={onSignIn}
            className="mt-3 inline-flex items-center rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-hover)]"
          >
            Send magic link
          </button>
          {status && <p className="mt-2 text-sm">{status}</p>}
          <button onClick={onDiagnose} className="mt-3 text-xs underline opacity-70">Run connection test</button>
          {diag && <p className="mt-1 text-xs opacity-80">{diag}</p>}
        </div>
      )}
    </div>
  );
}
