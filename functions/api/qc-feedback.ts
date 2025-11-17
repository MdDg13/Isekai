/**
 * QC Feedback API Endpoint
 * 
 * Receives feedback from QC review interface and stores it
 * 
 * Note: Cloudflare Pages Functions run in a serverless environment and cannot
 * write to the local filesystem. For local development, feedback is stored in
 * localStorage as a fallback. Use the export script to save feedback to files.
 */

import type { PagesFunction } from '@cloudflare/workers-types';

export const onRequestPost: PagesFunction = async (context) => {
  try {
    const feedback = await context.request.json();
    
    // Validate feedback structure
    if (!feedback.itemId || !feedback.dataType || !feedback.issue || !feedback.description) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // In a production environment, you would:
    // 1. Store feedback in Supabase (recommended)
    // 2. Or use Cloudflare KV/Durable Objects for storage
    // 3. Queue for processing
    // 4. Notify administrators
    
    // For local development, the frontend stores in localStorage as fallback
    // Use scripts/export-localStorage-feedback.html to export feedback
    
    const feedbackId = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Feedback received (stored in localStorage - use export script to save)',
        feedbackId
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error processing feedback:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process feedback' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

