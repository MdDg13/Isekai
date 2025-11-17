'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter, useSearchParams } from 'next/navigation';

function ReportErrorForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    item_type: '',
    item_name: '',
    item_source: '',
    issue_type: '',
    description: '',
    expected_value: '',
    actual_value: '',
    suggested_fix: '',
    email: '',
  });

  // Pre-fill form from URL parameters
  useEffect(() => {
    if (searchParams) {
      setFormData(prev => ({
        ...prev,
        item_type: searchParams.get('item_type') || prev.item_type,
        item_name: searchParams.get('item_name') || prev.item_name,
        item_source: searchParams.get('item_source') || prev.item_source,
      }));
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

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
        .insert({
          item_type: formData.item_type,
          item_name: formData.item_name,
          item_source: formData.item_source || null,
          issue_type: formData.issue_type,
          description: formData.description,
          expected_value: formData.expected_value || null,
          actual_value: formData.actual_value || null,
          suggested_fix: formData.suggested_fix || null,
          submitted_by: user?.id || null,
          submitted_by_email: user?.email || formData.email || null,
          is_anonymous: !user && !formData.email,
          status: 'pending',
        });

      if (error) throw error;

      setSubmitted(true);
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-green-800 mb-2">Thank You!</h2>
          <p className="text-green-700">
            Your feedback has been submitted. Our team will review it and make improvements.
          </p>
          <p className="text-sm text-green-600 mt-4">
            Redirecting to home page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Report Error or Bad Data</h1>
      <p className="text-gray-600 mb-6">
        Found an error in our reference data? Let us know! Your feedback helps us improve
        the quality of our content library.
      </p>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label className="block font-medium mb-2">
            What type of content has the error? <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.item_type}
            onChange={(e) => setFormData({ ...formData, item_type: e.target.value })}
            required
            className="w-full p-2 border rounded"
          >
            <option value="">Select type...</option>
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
          <label className="block font-medium mb-2">
            Item Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.item_name}
            onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
            required
            placeholder="e.g., Fireball, Longsword, Aboleth"
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block font-medium mb-2">Source (optional)</label>
          <input
            type="text"
            value={formData.item_source}
            onChange={(e) => setFormData({ ...formData, item_source: e.target.value })}
            placeholder="e.g., Player's Handbook, Monster Manual"
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block font-medium mb-2">
            What&apos;s the issue? <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.issue_type}
            onChange={(e) => setFormData({ ...formData, issue_type: e.target.value })}
            required
            className="w-full p-2 border rounded"
          >
            <option value="">Select issue type...</option>
            <option value="missing_data">Missing Data</option>
            <option value="incorrect_data">Incorrect Data</option>
            <option value="false_positive">False Positive (shouldn&apos;t be here)</option>
            <option value="formatting">Formatting Issue</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block font-medium mb-2">
            Describe the issue <span className="text-red-500">*</span>
          </label>
            <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            rows={4}
            placeholder="Please describe what&apos;s wrong..."
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block font-medium mb-2">Expected Value (if applicable)</label>
          <textarea
            value={formData.expected_value}
            onChange={(e) => setFormData({ ...formData, expected_value: e.target.value })}
            rows={3}
            placeholder="What should the correct value be?"
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block font-medium mb-2">Actual Value (if applicable)</label>
          <textarea
            value={formData.actual_value}
            onChange={(e) => setFormData({ ...formData, actual_value: e.target.value })}
            rows={3}
            placeholder="What is currently shown?"
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block font-medium mb-2">Suggested Fix (optional)</label>
          <textarea
            value={formData.suggested_fix}
            onChange={(e) => setFormData({ ...formData, suggested_fix: e.target.value })}
            rows={3}
            placeholder="Any suggestions on how to fix this?"
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block font-medium mb-2">Email (optional, for follow-up)</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="your@email.com"
            className="w-full p-2 border rounded"
          />
          <p className="text-sm text-gray-500 mt-1">
            If you&apos;re logged in, we&apos;ll use your account email. Otherwise, provide an email if you&apos;d like updates.
          </p>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ReportErrorPage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-6">Loading...</div>}>
      <ReportErrorForm />
    </Suspense>
  );
}

