'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

interface QCFeedback {
  id: string;
  item_type: string;
  item_name: string;
  item_source: string | null;
  issue_type: string;
  description: string;
  expected_value: string | null;
  actual_value: string | null;
  suggested_fix: string | null;
  status: string;
  submitted_by_email: string | null;
  created_at: string;
  reviewed_at: string | null;
  review_notes: string | null;
}

export default function QCFeedbackAdminPage() {
  const [feedback, setFeedback] = useState<QCFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{ status?: string; item_type?: string; issue_type?: string }>({});
  const [selectedFeedback, setSelectedFeedback] = useState<QCFeedback | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [newStatus, setNewStatus] = useState('pending');

  const loadFeedback = useCallback(async () => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase credentials not configured');
      }
      const supabase = createClient(supabaseUrl, supabaseKey);
      let query = supabase
        .from('qc_feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter.status) {
        query = query.eq('status', filter.status);
      }
      if (filter.item_type) {
        query = query.eq('item_type', filter.item_type);
      }
      if (filter.issue_type) {
        query = query.eq('issue_type', filter.issue_type);
      }

      const { data, error } = await query;

      if (error) throw error;
      setFeedback(data || []);
    } catch (error) {
      console.error('Error loading feedback:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  async function updateFeedbackStatus(feedbackId: string, status: string, notes: string) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase credentials not configured');
      }
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('qc_feedback')
        .update({
          status,
          review_notes: notes,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', feedbackId);

      if (error) throw error;

      await loadFeedback();
      setSelectedFeedback(null);
      setReviewNotes('');
    } catch (error) {
      console.error('Error updating feedback:', error);
      alert('Failed to update feedback status');
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading feedback...</div>
      </div>
    );
  }

  const statusCounts = feedback.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="w-full p-6">
      <h1 className="text-3xl font-bold mb-6">Content Review & Corrections</h1>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {['pending', 'reviewed', 'fixed', 'rejected', 'duplicate'].map((status) => (
          <div key={status} className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold">{statusCounts[status] || 0}</div>
            <div className="text-sm text-gray-600 capitalize">{status}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={filter.status || ''}
              onChange={(e) => setFilter({ ...filter, status: e.target.value || undefined })}
              className="w-full p-2 border rounded"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="fixed">Fixed</option>
              <option value="rejected">Rejected</option>
              <option value="duplicate">Duplicate</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Item Type</label>
            <select
              value={filter.item_type || ''}
              onChange={(e) => setFilter({ ...filter, item_type: e.target.value || undefined })}
              className="w-full p-2 border rounded"
            >
              <option value="">All Types</option>
              <option value="spell">Spell</option>
              <option value="monster">Monster</option>
              <option value="item">Item</option>
              <option value="feat">Feat</option>
              <option value="class">Class</option>
              <option value="subclass">Subclass</option>
              <option value="race">Race</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Issue Type</label>
            <select
              value={filter.issue_type || ''}
              onChange={(e) => setFilter({ ...filter, issue_type: e.target.value || undefined })}
              className="w-full p-2 border rounded"
            >
              <option value="">All Issues</option>
              <option value="missing_data">Missing Data</option>
              <option value="incorrect_data">Incorrect Data</option>
              <option value="false_positive">False Positive</option>
              <option value="formatting">Formatting</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        {feedback.map((item) => (
          <div
            key={item.id}
            className="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-lg transition"
            onClick={() => {
              setSelectedFeedback(item);
              setNewStatus(item.status);
              setReviewNotes(item.review_notes || '');
            }}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-lg">{item.item_name}</span>
                  <span className="px-2 py-1 bg-gray-100 rounded text-sm capitalize">
                    {item.item_type}
                  </span>
                  <span className={`px-2 py-1 rounded text-sm text-white ${
                    item.status === 'pending' ? 'bg-yellow-500' :
                    item.status === 'fixed' ? 'bg-green-500' :
                    item.status === 'rejected' ? 'bg-red-500' :
                    'bg-blue-500'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Issue:</span> {item.issue_type.replace('_', ' ')}
                </div>
                <p className="text-gray-700">{item.description}</p>
                <div className="text-xs text-gray-500 mt-2">
                  Submitted {new Date(item.created_at).toLocaleDateString()} by{' '}
                  {item.submitted_by_email || 'Anonymous'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Review Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold mb-4">Review Feedback</h2>

            <div className="space-y-4 mb-4">
              <div>
                <label className="font-medium">Item:</label>
                <div>{selectedFeedback.item_name} ({selectedFeedback.item_type})</div>
              </div>
              <div>
                <label className="font-medium">Issue Type:</label>
                <div className="capitalize">{selectedFeedback.issue_type.replace('_', ' ')}</div>
              </div>
              <div>
                <label className="font-medium">Description:</label>
                <div className="bg-gray-50 p-3 rounded">{selectedFeedback.description}</div>
              </div>
              {selectedFeedback.expected_value && (
                <div>
                  <label className="font-medium">Expected Value:</label>
                  <div className="bg-gray-50 p-3 rounded">{selectedFeedback.expected_value}</div>
                </div>
              )}
              {selectedFeedback.actual_value && (
                <div>
                  <label className="font-medium">Actual Value:</label>
                  <div className="bg-gray-50 p-3 rounded">{selectedFeedback.actual_value}</div>
                </div>
              )}
              {selectedFeedback.suggested_fix && (
                <div>
                  <label className="font-medium">Suggested Fix:</label>
                  <div className="bg-gray-50 p-3 rounded">{selectedFeedback.suggested_fix}</div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-2">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="fixed">Fixed</option>
                  <option value="rejected">Rejected</option>
                  <option value="duplicate">Duplicate</option>
                </select>
              </div>
              <div>
                <label className="block font-medium mb-2">Review Notes</label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full p-2 border rounded"
                  rows={4}
                  placeholder="Add notes about this feedback..."
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => updateFeedbackStatus(selectedFeedback.id, newStatus, reviewNotes)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Update Status
              </button>
              <button
                onClick={() => {
                  setSelectedFeedback(null);
                  setReviewNotes('');
                }}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

