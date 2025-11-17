'use client';

import { useState, useMemo, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
type JsonRecord = Record<string, unknown>;

interface ReferenceItem {
  id?: string;
  name?: string;
  source?: string;
  kind?: string;
  category?: string;
  rarity?: string;
  cost_gp?: number;
  weight_lb?: number;
  attunement?: boolean;
  attunement_requirements?: string;
  properties?: JsonRecord | null;
  description?: string;
  level?: number;
  school?: string;
  casting_time?: string;
  range?: string;
  components?: string;
  material_components?: string;
  duration?: string;
  ritual?: boolean;
  concentration?: boolean;
  higher_level?: string;
  size?: string;
  type?: string;
  alignment?: string;
  challenge_rating?: number;
  armor_class?: number;
  hit_points?: number;
  hit_dice?: string;
  speed?: JsonRecord;
  stats?: JsonRecord;
  traits?: JsonRecord;
  actions?: JsonRecord;
  page_reference?: string;
  [key: string]: unknown;
}

interface ReferenceDetailClientProps {
  type: string;
  id: string;
}

export default function ReferenceDetailClient({ type, id }: ReferenceDetailClientProps) {
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
  }, []);

  const [item, setItem] = useState<ReferenceItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !type || !id) return;

    const loadItem = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from(`reference_${type}`)
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Load error:', error);
          setItem(null);
        } else {
          setItem(data as ReferenceItem);
        }
      } catch (err) {
        console.error('Load failed:', err);
        setItem(null);
      } finally {
        setLoading(false);
      }
    };

    loadItem();
  }, [supabase, type, id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 p-8">
        <div className="w-full px-4 sm:px-6">
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 p-8">
        <div className="w-full px-4 sm:px-6">
          <p className="text-gray-400">Item not found</p>
          <Link href="/reference" className="text-blue-400 hover:text-blue-300 mt-4 inline-block">
            ← Back to Reference Library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8">
      <div className="w-full px-4 sm:px-6">
        <div className="flex items-center justify-between mb-4">
          <Link href="/reference" className="text-blue-400 hover:text-blue-300 inline-block">
            ← Back to Reference Library
          </Link>
        </div>

        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">{String(item.name ?? 'Unknown')}</h1>
            {(() => {
              const source = item.source;
              if (source && typeof source === 'string') {
                return <p className="text-gray-400">Source: {source}</p>;
              }
              return null;
            })()}
          </div>
          <Link
            href={`/report-error?item_type=${type}&item_name=${encodeURIComponent(String(item.name ?? ''))}&item_source=${encodeURIComponent(String(item.source ?? ''))}`}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
          >
            Report Error
          </Link>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
          {type === 'item' && (
            <>
              {item.kind && <div><strong>Kind:</strong> {String(item.kind)}</div>}
              {item.category && <div><strong>Category:</strong> {String(item.category)}</div>}
              {item.rarity && <div><strong>Rarity:</strong> {String(item.rarity)}</div>}
              {typeof item.cost_gp === 'number' ? <div><strong>Cost:</strong> {item.cost_gp} gp</div> : null}
              {typeof item.weight_lb === 'number' ? <div><strong>Weight:</strong> {item.weight_lb} lb</div> : null}
              {item.attunement ? (
                <div>
                  <strong>Attunement:</strong> Required
                  {item.attunement_requirements ? ` (${String(item.attunement_requirements)})` : null}
                </div>
              ) : null}
              {item.properties && (
                <div>
                  <strong>Properties:</strong>
                  <pre className="mt-2 text-sm bg-gray-800 p-2 rounded">{JSON.stringify(item.properties, null, 2)}</pre>
                </div>
              )}
              {item.description && (
                <div>
                  <strong>Description:</strong>
                  <p className="mt-2 text-gray-300 whitespace-pre-wrap">{String(item.description)}</p>
                </div>
              )}
            </>
          )}

          {type === 'spell' && (
            <>
              {typeof item.level === 'number' ? <div><strong>Level:</strong> {item.level === 0 ? 'Cantrip' : item.level}</div> : null}
              {item.school && <div><strong>School:</strong> {String(item.school)}</div>}
              {item.casting_time && <div><strong>Casting Time:</strong> {String(item.casting_time)}</div>}
              {item.range && <div><strong>Range:</strong> {String(item.range)}</div>}
              {item.components && <div><strong>Components:</strong> {String(item.components)}</div>}
              {item.material_components && <div><strong>Material:</strong> {String(item.material_components)}</div>}
              {item.duration && <div><strong>Duration:</strong> {String(item.duration)}</div>}
              {item.ritual && <div><strong>Ritual:</strong> Yes</div>}
              {item.concentration && <div><strong>Concentration:</strong> Yes</div>}
              {item.description && (
                <div>
                  <strong>Description:</strong>
                  <p className="mt-2 text-gray-300 whitespace-pre-wrap">{String(item.description)}</p>
                </div>
              )}
              {item.higher_level && (
                <div>
                  <strong>At Higher Levels:</strong>
                  <p className="mt-2 text-gray-300 whitespace-pre-wrap">{String(item.higher_level)}</p>
                </div>
              )}
            </>
          )}

          {type === 'monster' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                {item.size && <div><strong>Size:</strong> {String(item.size)}</div>}
                {item.type && <div><strong>Type:</strong> {String(item.type)}</div>}
                {item.alignment && <div><strong>Alignment:</strong> {String(item.alignment)}</div>}
                {typeof item.challenge_rating === 'number' ? <div><strong>Challenge Rating:</strong> {item.challenge_rating}</div> : null}
                {typeof item.armor_class === 'number' ? <div><strong>Armor Class:</strong> {item.armor_class}</div> : null}
                {typeof item.hit_points === 'number' ? <div><strong>Hit Points:</strong> {item.hit_points}</div> : null}
                {item.hit_dice && <div><strong>Hit Dice:</strong> {String(item.hit_dice)}</div>}
              </div>
              {item.speed && (
                <div>
                  <strong>Speed:</strong>
                  <pre className="mt-2 text-sm bg-gray-800 p-2 rounded">{JSON.stringify(item.speed, null, 2)}</pre>
                </div>
              )}
              {item.stats && (
                <div>
                  <strong>Ability Scores:</strong>
                  <pre className="mt-2 text-sm bg-gray-800 p-2 rounded">{JSON.stringify(item.stats, null, 2)}</pre>
                </div>
              )}
              {item.traits && (
                <div>
                  <strong>Traits:</strong>
                  <pre className="mt-2 text-sm bg-gray-800 p-2 rounded">{JSON.stringify(item.traits, null, 2)}</pre>
                </div>
              )}
              {item.actions && (
                <div>
                  <strong>Actions:</strong>
                  <pre className="mt-2 text-sm bg-gray-800 p-2 rounded">{JSON.stringify(item.actions, null, 2)}</pre>
                </div>
              )}
            </>
          )}

          {item.page_reference && (
            <div className="mt-4 pt-4 border-t border-gray-800 text-sm text-gray-400">
              <strong>Page Reference:</strong> {String(item.page_reference)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

