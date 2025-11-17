"use client";

import { createClient } from "@supabase/supabase-js";
import { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import BuildBadge from "@/components/BuildBadge";

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
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [worlds, setWorlds] = useState<Array<{ id: string; name: string; slug: string; campaigns?: Array<{ id: string; name: string; world_id: string }> }>>([]);
  const [newWorldName, setNewWorldName] = useState("");
  const [showCreateWorld, setShowCreateWorld] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [creatingCampaignForWorld, setCreatingCampaignForWorld] = useState<string | null>(null);

  const loadWorlds = useCallback(async () => {
    if (!supabase) return;
    
    // Load worlds with their campaigns
    const { data: worldsData, error: worldsError } = await supabase
      .from('world')
      .select('id,name,slug')
      .order('created_at', { ascending: false });
    
    if (worldsError) {
      console.error('Error loading worlds:', worldsError);
      setStatus(`Error loading worlds: ${worldsError.message}`);
      return;
    }
    
    if (!worldsData || worldsData.length === 0) {
      setWorlds([]);
      return;
    }
    
    // Load campaigns for each world
    const { data: campaignsData, error: campaignsError } = await supabase
      .from('campaign')
      .select('id,name,world_id')
      .order('created_at', { ascending: false });
    
    if (campaignsError) {
      console.error('Error loading campaigns:', campaignsError);
      setStatus(`Error loading campaigns: ${campaignsError.message}`);
    }
    
    // Group campaigns by world
    const campaignsByWorld = (campaignsData || []).reduce((acc, camp) => {
      if (!acc[camp.world_id]) acc[camp.world_id] = [];
      acc[camp.world_id].push(camp);
      return acc;
    }, {} as Record<string, Array<{ id: string; name: string; world_id: string }>>);
    
    setWorlds(worldsData.map(w => ({
      ...w,
      campaigns: campaignsByWorld[w.id] || []
    })));
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;
    
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadWorlds();
      }
    });

    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadWorlds();
      } else {
        setWorlds([]);
      }
    });
  }, [supabase, loadWorlds]);

  const createWorld = async () => {
    if (!newWorldName.trim() || !user || !supabase) return;
    
    setStatus("Creating world...");
    const slug = newWorldName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    const { error } = await supabase
      .from('world')
      .insert({
        name: newWorldName.trim(),
        slug,
        ruleset: 'DND5E_2024',
      });

    if (error) {
      setStatus(`Error creating world: ${error.message}`);
    } else {
      setStatus("World created!");
      setNewWorldName("");
      setShowCreateWorld(false);
      loadWorlds();
    }
  };

  const createCampaign = async (worldId: string) => {
    if (!newCampaignName.trim() || !user || !supabase) return;
    
    setStatus("Creating campaign...");
    const slug = newCampaignName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    const { data: campaign, error: campaignError } = await supabase
      .from('campaign')
      .insert({
        world_id: worldId,
        name: newCampaignName.trim(),
        slug,
      })
      .select()
      .single();

    if (campaignError) {
      setStatus(`Error creating campaign: ${campaignError.message}`);
      return;
    }

    // Add creator as DM
    if (campaign && user.id) {
      const { error: memberError } = await supabase
        .from('campaign_member')
        .insert({
          campaign_id: campaign.id,
          user_id: user.id,
          role: 'dm',
        });

      if (memberError) {
        setStatus(`Campaign created, but failed to add you as DM: ${memberError.message}`);
      } else {
        setStatus("Campaign created!");
        setNewCampaignName("");
        setCreatingCampaignForWorld(null);
        loadWorlds();
        // Navigate to the new campaign
        window.location.href = `/campaign/${campaign.id}/`;
      }
    }
  };

  const onSignIn = async () => {
    if (!supabase) {
      setStatus("Error: Supabase configuration is missing. Please check environment variables.");
      console.error("Supabase client is null - check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
      return;
    }
    
    if (!email || !email.includes('@')) {
      setStatus("Please enter a valid email address.");
      return;
    }
    
    if (isLoading) return; // Prevent double-clicks
    
    setIsLoading(true);
    setStatus("Sending magic link...");
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: window.location.origin },
      });
      
      if (error) {
        setStatus(`Error: ${error.message}`);
        console.error("Sign-in error:", error);
      } else {
        setStatus("Check your email for a magic link.");
      }
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : 'Failed to send magic link'}`);
      console.error("Sign-in exception:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const onSignOut = async () => {
    if (!supabase) return;
    
    await supabase.auth.signOut();
    setUser(null);
    setWorlds([]);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6">
      <div className="w-full max-w-5xl mx-auto">
        <header className="mb-6 sm:mb-8">
          <div className="mb-2">
            <h1 className="font-display text-2xl sm:text-3xl">Isekai</h1>
            <div className="mt-1">
              <BuildBadge />
            </div>
          </div>
          {user ? (
            <div className="flex items-center justify-between">
              <p className="text-xs sm:text-sm text-gray-400">Welcome, {user.email || 'User'}</p>
              <button
                onClick={onSignOut}
                className="text-xs underline opacity-70 hover:opacity-100"
              >
                Sign out
              </button>
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-gray-400">Sign in to get started.</p>
          )}
        </header>

        {user ? (
          <div className="space-y-4">
            {/* World Selection */}
            <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-medium">World Selection</h2>
                <button
                  onClick={() => setShowCreateWorld(true)}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-xs sm:text-sm font-medium text-white hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation"
                >
                  + New World
                </button>
              </div>
              
              {worlds.length === 0 ? (
                <p className="text-sm text-gray-400">No worlds yet. Create your first world!</p>
              ) : (
                <div className="space-y-3">
                  {worlds.map((world) => (
                    <div key={world.id} className="rounded-lg border border-gray-800 bg-gray-900/30 p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <Link
                            href={`/world/${world.id}/`}
                            className="font-medium text-base sm:text-lg hover:text-blue-400 transition-colors block"
                          >
                            {world.name}
                          </Link>
                          <p className="text-xs text-gray-500 mt-1">World-level content (NPCs, locations, items, lore)</p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <span className="text-xs text-gray-500">{world.campaigns?.length || 0} campaigns</span>
                          <button
                            onClick={() => setCreatingCampaignForWorld(world.id)}
                            className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation"
                            title="Add campaign to this world"
                          >
                            + Campaign
                          </button>
                        </div>
                      </div>

                      {/* Create Campaign Form for this world */}
                      {creatingCampaignForWorld === world.id && (
                        <div className="rounded-md border border-gray-700 bg-gray-900/50 p-3 mb-3">
                          <input
                            className="w-full rounded-md border border-gray-700 bg-gray-900/50 p-2 text-sm outline-none focus:border-blue-600 mb-2"
                            type="text"
                            placeholder="Campaign name"
                            value={newCampaignName}
                            onChange={(e) => setNewCampaignName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                createCampaign(world.id);
                              } else if (e.key === 'Escape') {
                                setCreatingCampaignForWorld(null);
                                setNewCampaignName("");
                              }
                            }}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => createCampaign(world.id)}
                              className="flex-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation"
                            >
                              Create
                            </button>
                            <button
                              onClick={() => {
                                setCreatingCampaignForWorld(null);
                                setNewCampaignName("");
                              }}
                              className="flex-1 rounded-md border border-gray-700 px-3 py-1.5 text-xs font-medium hover:bg-gray-800 active:bg-gray-700 transition-colors touch-manipulation"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {world.campaigns && world.campaigns.length > 0 ? (
                        <div className="space-y-2">
                          {world.campaigns.map((campaign) => (
                            <Link
                              key={campaign.id}
                              href={`/campaign/${campaign.id}/`}
                              className="block rounded-md bg-blue-600/20 border border-blue-600/30 p-3 hover:bg-blue-600/30 active:bg-blue-600/40 transition-colors touch-manipulation"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm sm:text-base">{campaign.name}</span>
                                <span className="text-xs text-blue-400">→</span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        !creatingCampaignForWorld && (
                          <p className="text-xs text-gray-500 mt-2">No campaigns in this world yet. Click &quot;+ Campaign&quot; to create one.</p>
                        )
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Create World Form */}
            {showCreateWorld && (
              <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4 sm:p-6">
                <h3 className="text-lg font-medium mb-4">Create New World</h3>
                <input
                  className="w-full rounded-md border border-gray-700 bg-gray-900/50 p-3 text-sm outline-none focus:border-blue-600 mb-3"
                  type="text"
                  placeholder="World name"
                  value={newWorldName}
                  onChange={(e) => setNewWorldName(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    onClick={createWorld}
                    className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateWorld(false);
                      setNewWorldName("");
                    }}
                    className="flex-1 rounded-md border border-gray-700 px-4 py-2 text-sm font-medium hover:bg-gray-800 active:bg-gray-700 transition-colors touch-manipulation"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {status && <p className="text-sm text-gray-300">{status}</p>}
          </div>
        ) : (
          <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4 sm:p-6">
            <label className="mb-2 block text-sm font-medium">Email</label>
            <input
              className="w-full rounded-md border border-gray-700 bg-gray-900/50 p-3 text-sm outline-none focus:border-blue-600"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              onClick={onSignIn}
              disabled={isLoading || !email.trim()}
              className="mt-3 w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
            >
              {isLoading ? "Sending..." : "Send magic link"}
            </button>
            {status && <p className="mt-2 text-sm text-gray-300">{status}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
