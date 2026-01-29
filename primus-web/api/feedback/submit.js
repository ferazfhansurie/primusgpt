import { kv } from '@vercel/kv';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { email, message, category, url, userAgent, timestamp } = body;

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate unique ID for feedback
    const feedbackId = `feedback:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;

    // Store feedback in KV store
    const feedbackData = {
      id: feedbackId,
      email: email || 'anonymous',
      message,
      category,
      url,
      userAgent,
      timestamp: timestamp || new Date().toISOString(),
      status: 'new',
      resolved: false,
    };

    // Save individual feedback
    await kv.set(feedbackId, feedbackData);

    // Add to feedback list (for easy retrieval)
    await kv.lpush('feedback:list', feedbackId);

    // Set TTL to 90 days (optional, removes old feedback)
    await kv.expire(feedbackId, 90 * 24 * 60 * 60);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Feedback submitted successfully',
        feedbackId 
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to submit feedback' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
