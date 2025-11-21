/**
 * AI-Generated Artistic Dungeon Maps
 * 
 * Converts procedural dungeon layouts into hand-drawn style map images
 * using Cloudflare Workers AI (Stable Diffusion XL)
 */

import type { DungeonLevel } from './dungeon-generator/types';

export type DungeonType = 'dungeon' | 'cave' | 'ruin' | 'fortress' | 'tower' | 'temple' | 'lair';

interface AIGenerationOptions {
  dungeonType: DungeonType;
  width: number;
  height: number;
  seed?: number;
}

/**
 * Convert dungeon layout to detailed text description for AI prompt
 */
export function layoutToAIPrompt(level: DungeonLevel, options: AIGenerationOptions): string {
  const { dungeonType, width, height } = options;
  const { rooms, corridors, stairs } = level;
  
  const typeDescriptions: Record<DungeonType, string> = {
    dungeon: 'stone-built dungeon with worked stone walls, flagstone floors, classic D&D dungeon aesthetic',
    cave: 'natural cave system with organic, irregular walls, rough stone, natural formations',
    ruin: 'ancient ruins with crumbling walls, collapsed sections, weathered stone, overgrown areas',
    fortress: 'military fortress with thick walls, regular architecture, stone blocks, defensive features',
    tower: 'tower interior with circular/rectangular rooms, vertical structure, spiral stairs',
    temple: 'sacred temple with ornate architecture, carved stone, religious symbols',
    lair: 'monster lair with rough, natural construction, organic shapes, minimal worked stone',
  };
  
  const typeDescription = typeDescriptions[dungeonType] || typeDescriptions.dungeon;
  
  // Build room descriptions
  const roomDescriptions = rooms.map((room, idx) => {
    const roomType = room.type === 'entry' ? 'entrance' : 
                     room.type === 'exit' ? 'exit' :
                     room.type === 'stairwell' ? 'stairwell' :
                     room.type === 'special' ? 'special chamber' : 'chamber';
    
    const connections = room.connections.length > 0 
      ? `, connected to ${room.connections.length} other area${room.connections.length > 1 ? 's' : ''}`
      : '';
    
    const features = room.features.length > 0
      ? `, contains ${room.features.map(f => f.type).join(', ')}`
      : '';
    
    return `Room ${idx + 1} at grid position (${room.x},${room.y}) is ${room.width * 5}x${room.height * 5} feet, ${roomType}${connections}${features}`;
  }).join('; ');
  
  // Build corridor descriptions
  const corridorDescriptions = corridors.map((corridor, idx) => {
    if (corridor.path.length < 2) return '';
    const start = corridor.path[0];
    const end = corridor.path[corridor.path.length - 1];
    return `Corridor ${idx + 1} from (${start.x},${start.y}) to (${end.x},${end.y}), ${corridor.width * 5} feet wide`;
  }).filter(Boolean).join('; ');
  
  // Build door descriptions
  const doorDescriptions = rooms.flatMap(room => 
    room.doors.map(door => 
      `${door.type} door at (${door.x},${door.y}) in room at (${room.x},${room.y})`
    )
  ).join('; ');
  
  // Build stair descriptions
  const stairDescriptions = stairs.map(stair => 
    `Stairs at (${stair.x},${stair.y}) leading ${stair.direction} from level ${stair.from_level} to level ${stair.to_level}`
  ).join('; ');
  
  // Construct full prompt
  const prompt = `Create a top-down dungeon map in hand-drawn black and white style, similar to classic D&D maps by Dyson Logos or Mike Schley.

Map specifications:
- Style: Clean black lines on white background, hand-drawn aesthetic, no color fills
- Type: ${typeDescription}
- Grid size: ${width}x${height} cells (${width * 5}x${height * 5} feet)
- Scale: 5-foot squares clearly visible with subtle grid lines
- Rooms: ${roomDescriptions}
- Corridors: ${corridorDescriptions}
${doorDescriptions ? `- Doors: ${doorDescriptions}` : ''}
${stairDescriptions ? `- Stairs: ${stairDescriptions}` : ''}

Requirements:
- Black line art only, no color fills
- Clear, readable, artistic hand-drawn style
- Room boundaries clearly defined
- Corridors and connections visible
- Grid lines subtle but present
- Professional D&D map quality`;

  return prompt;
}

/**
 * Generate dungeon map image using Cloudflare Workers AI
 */
export async function generateDungeonMapImage(
  level: DungeonLevel,
  options: AIGenerationOptions,
  apiToken: string,
  accountId: string
): Promise<ArrayBuffer> {
  const prompt = layoutToAIPrompt(level, options);
  const seed = options.seed ?? Math.floor(Math.random() * 1_000_000_000);
  
  // Use Stable Diffusion XL for high-quality image generation
  const model = '@cf/stabilityai/stable-diffusion-xl-base-1.0';
  
  // Calculate appropriate image size (aim for ~1 pixel per foot for readability)
  const cellSize = level.grid.cell_size || 5; // feet per cell
  const widthFeet = level.grid.width * cellSize;
  const heightFeet = level.grid.height * cellSize;
  
  // Target resolution: ~10 pixels per 5ft square for clarity
  // Clamp to reasonable bounds (512-1536)
  const targetWidth = Math.max(512, Math.min(1536, Math.ceil(widthFeet / 5 * 10)));
  const targetHeight = Math.max(512, Math.min(1536, Math.ceil(heightFeet / 5 * 10)));
  
  // Round to nearest 64 (common requirement for SD models)
  const imageWidth = Math.round(targetWidth / 64) * 64;
  const imageHeight = Math.round(targetHeight / 64) * 64;
  
  const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      num_steps: 20, // Balance quality vs speed
      guidance: 7.5, // Standard guidance for line art
      width: imageWidth,
      height: imageHeight,
      seed,
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI generation failed: ${response.status} ${errorText}`);
  }
  
  // Workers AI returns binary PNG data
  const imageData = await response.arrayBuffer();
  return imageData;
}

/**
 * Upload generated map image to Supabase Storage
 */
export async function uploadMapToStorage(
  imageData: ArrayBuffer,
  dungeonId: string,
  levelIndex: number,
  supabaseUrl: string,
  supabaseKey: string
): Promise<string> {
  // Create Supabase client
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const fileName = `${dungeonId}/${levelIndex}.png`;
  const bucket = 'dungeon-maps';
  
  // Convert ArrayBuffer to Blob
  const blob = new Blob([imageData], { type: 'image/png' });
  
  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, blob, {
      contentType: 'image/png',
      upsert: true,
    });
  
  if (error) {
    // If bucket doesn't exist, provide helpful error
    if (error.message.includes('Bucket not found') || error.message.includes('does not exist')) {
      throw new Error(`Storage bucket '${bucket}' not found. Please run the setup SQL: docs/db/setup-dungeon-maps-storage.sql`);
    }
    throw new Error(`Failed to upload map: ${error.message}`);
  }
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);
  
  return urlData.publicUrl;
}

