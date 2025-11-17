'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import SettingsIcon from '@/components/SettingsIcon';

type TableType = 'spell' | 'monster' | 'item' | 'feat' | 'class' | 'subclass' | 'race';

interface TableData {
  id: string;
  name: string;
  [key: string]: unknown;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'data-browser' | 'feedback' | 'account' | 'preferences'>('data-browser');
  const [selectedTable, setSelectedTable] = useState<TableType | null>(null);
  const [tableData, setTableData] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<TableData | null>(null);

  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
  }, []);

  const loadTableData = async () => {
    if (!selectedTable || !supabase) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from(`reference_${selectedTable}`)
        .select('*')
        .order('name', { ascending: true })
        .limit(100);

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTableData(data || []);
    } catch (error) {
      console.error('Error loading table data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTable && supabase) {
      loadTableData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTable, supabase]);

  useEffect(() => {
    if (searchTerm && selectedTable && supabase) {
      const timeout = setTimeout(() => {
        loadTableData();
      }, 300);
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const tableTypes: Array<{ value: TableType; label: string; count?: number }> = [
    { value: 'spell', label: 'Spells' },
    { value: 'monster', label: 'Monsters' },
    { value: 'item', label: 'Items' },
    { value: 'feat', label: 'Feats' },
    { value: 'class', label: 'Classes' },
    { value: 'subclass', label: 'Subclasses' },
    { value: 'race', label: 'Races' },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-xs text-gray-400 hover:text-gray-300">← Back</Link>
              <h1 className="text-xl sm:text-2xl font-medium">Settings</h1>
            </div>
            <SettingsIcon />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Tabs */}
        <div className="border-b border-gray-800 mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('data-browser')}
              className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'data-browser'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              Data Browser
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'feedback'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              Feedback Review
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'account'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              Account
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'preferences'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              Preferences
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'data-browser' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium mb-4">Reference Data Browser</h2>
              <p className="text-sm text-gray-400 mb-4">
                Browse and review reference data. Click any item to view details and report errors.
              </p>
            </div>

            {/* Table Selection */}
            <div className="bg-gray-900 rounded-lg p-4">
              <label className="block text-sm font-medium mb-2">Select Table</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {tableTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => {
                      setSelectedTable(type.value);
                      setSelectedItem(null);
                      setSearchTerm('');
                    }}
                    className={`p-3 rounded border text-sm transition-colors ${
                      selectedTable === type.value
                        ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                        : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search and Data Display */}
            {selectedTable && (
              <div className="space-y-4">
                <div className="flex gap-4">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        loadTableData();
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={loadTableData}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
                  >
                    Search
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-8 text-gray-400">Loading...</div>
                ) : (
                  <div className="grid gap-2">
                    {tableData.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedItem(item);
                        }}
                        className="p-4 bg-gray-900 border border-gray-800 rounded-lg cursor-pointer hover:border-gray-700 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{item.name}</h3>
                            {item.source && (
                              <p className="text-xs text-gray-400 mt-1">Source: {String(item.source)}</p>
                            )}
                          </div>
                          <Link
                            href={`/reference/${selectedTable}/${item.id}`}
                            className="text-xs text-blue-400 hover:text-blue-300"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View →
                          </Link>
                        </div>
                      </div>
                    ))}
                    {tableData.length === 0 && !loading && (
                      <div className="text-center py-8 text-gray-400">
                        {searchTerm ? 'No results found' : 'Select a table to browse data'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Item Detail & Feedback */}
            {selectedItem && (
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium">{selectedItem.name}</h3>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="text-gray-400 hover:text-gray-300"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
                  {Object.entries(selectedItem)
                    .filter(([key]) => !['id', 'created_at', 'updated_at'].includes(key))
                    .map(([key, value]) => (
                      <div key={key} className="text-sm">
                        <span className="text-gray-400 font-medium">{key}:</span>{' '}
                        <span className="text-gray-300">
                          {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                        </span>
                      </div>
                    ))}
                </div>

                <div className="flex gap-4">
                  <Link
                    href={`/reference/${selectedTable}/${selectedItem.id}`}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
                  >
                    View Full Details
                  </Link>
                  <Link
                    href={`/report-error?item_type=${selectedTable}&item_name=${encodeURIComponent(String(selectedItem.name || ''))}&item_source=${encodeURIComponent(String(selectedItem.source || ''))}`}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm"
                  >
                    Report Error
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium mb-4">Feedback Review</h2>
              <p className="text-sm text-gray-400 mb-4">
                Review and manage user-submitted feedback on reference data. As a DM, you have access to review all feedback.
              </p>
            </div>
            <div className="space-y-4">
              <Link
                href="/admin/qc-feedback"
                className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Open Feedback Dashboard →
              </Link>
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <h3 className="font-medium mb-2">Quick Actions</h3>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• View all pending feedback</li>
                  <li>• Filter by status, item type, or issue type</li>
                  <li>• Update feedback status and add review notes</li>
                  <li>• Mark feedback as fixed when corrections are applied</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium mb-4">Account Settings</h2>
              <p className="text-sm text-gray-400">Account management options (coming soon)</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <p className="text-gray-400">Account settings will be available here.</p>
            </div>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium mb-4">Preferences</h2>
              <p className="text-sm text-gray-400">Application preferences (coming soon)</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <p className="text-gray-400">Preferences will be available here.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

