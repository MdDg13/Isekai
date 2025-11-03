export type Visibility = 'public' | 'party' | 'dm_only';
export type CampaignRole = 'dm' | 'player';

export interface World {
  id: string;
  name: string;
  slug: string;
  description?: string;
  ruleset?: string;
  created_at: string;
  created_by?: string;
}

export interface Campaign {
  id: string;
  world_id: string;
  name: string;
  slug: string;
  summary?: string;
  created_at: string;
  created_by?: string;
}

export interface CampaignMember {
  campaign_id: string;
  user_id: string;
  role: CampaignRole;
}

export interface Npc {
  id: string;
  campaign_id: string;
  name: string;
  bio?: string;
  backstory?: string;
  traits?: unknown;
  stats?: unknown;
  image_url?: string;
  voice_id?: string;
  location_id?: string | null;
  affiliations?: Array<{ type?: string; name?: string; ref_id?: string }>; 
  relationships?: Record<string, { attitude?: number; notes?: string }>;
  connections?: Array<{ kind: 'npc' | 'location' | 'item'; ref_id: string; label?: string }>;
  visibility: Visibility;
  permitted_member_ids?: string[];
  created_at: string;
  created_by?: string;
}

export interface NpcInteraction {
  id: string;
  campaign_id: string;
  npc_id: string;
  entry: string;
  by_user?: string;
  metadata?: unknown;
  created_at: string;
}

export interface Location {
  id: string;
  campaign_id: string;
  name: string;
  description?: string;
  region?: string;
  visibility: Visibility;
  permitted_member_ids?: string[];
  created_at: string;
  created_by?: string;
}

export interface Item {
  id: string;
  campaign_id: string;
  name: string;
  kind?: string;
  rarity?: string;
  props?: unknown;
  visibility: Visibility;
  permitted_member_ids?: string[];
  created_at: string;
  created_by?: string;
}

export interface Arc {
  id: string;
  campaign_id: string;
  title: string;
  synopsis?: string;
  created_at: string;
  created_by?: string;
}

export interface Beat {
  id: string;
  arc_id: string;
  title: string;
  details?: string;
  sequence?: number;
  visibility: Visibility;
  permitted_member_ids?: string[];
  created_at: string;
  created_by?: string;
}

export interface Encounter {
  id: string;
  campaign_id: string;
  name: string;
  difficulty?: string;
  participants?: unknown;
  loot?: unknown;
  visibility: Visibility;
  permitted_member_ids?: string[];
  created_at: string;
  created_by?: string;
}

export interface Shop {
  id: string;
  campaign_id: string;
  name: string;
  inventory?: unknown;
  visibility: Visibility;
  permitted_member_ids?: string[];
  created_at: string;
  created_by?: string;
}

export interface Scene {
  id: string;
  campaign_id: string;
  title: string;
  description?: string;
  background_image_url?: string;
  visibility: Visibility;
  permitted_member_ids?: string[];
  created_at: string;
  created_by?: string;
}


