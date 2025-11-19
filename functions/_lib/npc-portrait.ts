import type { GeneratedNPC } from './npc-procedural';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Upload portrait to Supabase Storage and return public URL
 */
export async function uploadPortraitToStorage(
  supabase: SupabaseClient,
  npcId: string,
  portraitBuffer: Buffer
): Promise<string | null> {
  try {
    const fileName = `npc-portraits/${npcId}.png`;
    
    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from('npc-assets')
      .upload(fileName, portraitBuffer, {
        contentType: 'image/png',
        upsert: true, // Overwrite if exists
      });
    
    if (error) {
      // If bucket doesn't exist, try to create it
      if (error.message.includes('Bucket not found')) {
        console.warn('npc-assets bucket not found, attempting to create...');
        // Note: Bucket creation requires admin access, may fail
        // For now, log and return null
        console.error('Cannot create bucket from function - create it in Supabase dashboard');
        return null;
      }
      throw error;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('npc-assets')
      .getPublicUrl(fileName);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Failed to upload portrait to storage:', error);
    return null;
  }
}

/**
 * Generate a portrait prompt from NPC data
 */
export function buildPortraitPrompt(npc: GeneratedNPC): string {
  const traits = npc.traits as { race?: string; class?: string; background?: string; temperament?: string } | undefined;
  const stats = npc.stats as { equipment?: string } | undefined;
  
  const race = traits?.race || 'human';
  const npcClass = traits?.class || 'commoner';
  const temperament = traits?.temperament || 'neutral';
  const equipment = stats?.equipment || '';
  const bio = npc.bio || '';
  
  // Extract key visual details from bio
  const visualKeywords: string[] = [];
  if (bio.toLowerCase().includes('armor')) visualKeywords.push('armor');
  if (bio.toLowerCase().includes('robe')) visualKeywords.push('robes');
  if (bio.toLowerCase().includes('staff')) visualKeywords.push('staff');
  if (bio.toLowerCase().includes('sword')) visualKeywords.push('sword');
  if (bio.toLowerCase().includes('bow')) visualKeywords.push('bow');
  if (bio.toLowerCase().includes('shield')) visualKeywords.push('shield');
  
  // Build equipment description
  let equipmentDesc = '';
  if (equipment) {
    const eqLower = equipment.toLowerCase();
    if (eqLower.includes('leather')) equipmentDesc = 'leather armor';
    else if (eqLower.includes('chain')) equipmentDesc = 'chain mail';
    else if (eqLower.includes('plate')) equipmentDesc = 'plate armor';
    else if (eqLower.includes('robe')) equipmentDesc = 'robes';
    else equipmentDesc = equipment.split(',')[0].trim();
  }
  
  // Build prompt
  const parts: string[] = [
    `Fantasy portrait of a ${race}`,
    npcClass !== 'commoner' ? npcClass : '',
    temperament !== 'neutral' ? `with a ${temperament} expression` : '',
    equipmentDesc ? `wearing ${equipmentDesc}` : '',
    ...visualKeywords.slice(0, 2),
    'high quality portrait',
    'painterly style',
    'neutral background',
    'detailed character art'
  ].filter(Boolean);
  
  return parts.join(', ');
}

/**
 * Generate NPC portrait using Workers AI
 */
export async function generateNPCPortrait(
  npc: GeneratedNPC,
  env: {
    CF_ACCOUNT_ID?: string;
    CF_WORKERS_AI_TOKEN?: string;
  }
): Promise<Buffer | null> {
  const accountId = env.CF_ACCOUNT_ID;
  const token = env.CF_WORKERS_AI_TOKEN;
  
  if (!accountId || !token) {
    console.warn('Workers AI credentials not available for portrait generation');
    return null;
  }
  
  const prompt = buildPortraitPrompt(npc);
  const model = '@cf/stabilityai/stable-diffusion-xl-base-1.0';
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);
  
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          width: 768,
          height: 1024,
          num_steps: 20,
          guidance: 7.5,
        }),
        signal: controller.signal,
      }
    );
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }
    
    // Check content type
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      const data = await response.json();
      const imageBase64 =
        data?.result?.image || data?.result?.[0]?.image || data?.result?.[0]?.img || data?.result;
      
      if (!imageBase64) {
        throw new Error('No image data returned from Workers AI');
      }
      
      return Buffer.from(imageBase64, 'base64');
    } else {
      // Binary PNG response
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Portrait generation timeout after 60 seconds');
    }
    throw error;
  }
}

