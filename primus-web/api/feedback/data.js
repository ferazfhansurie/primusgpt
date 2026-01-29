import { kv } from '@vercel/kv';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Get password from query params
    const url = new URL(req.url);
    const password = url.searchParams.get('password');

    // Simple password protection (same as analytics)
    if (password !== 'P@ssw0rd') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get all feedback IDs from the list
    const feedbackIds = await kv.lrange('feedback:list', 0, -1);

    if (!feedbackIds || feedbackIds.length === 0) {
      return new Response(
        JSON.stringify({ 
          feedbacks: [],
          total: 0,
          byCategory: {},
          byStatus: { new: 0, inProgress: 0, resolved: 0 }
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch all feedback data
    const feedbacks = [];
    for (const feedbackId of feedbackIds) {
      const feedback = await kv.get(feedbackId);
      if (feedback) {
        feedbacks.push(feedback);
      }
    }

    // Sort by timestamp (newest first)
    feedbacks.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Calculate statistics
    const byCategory = feedbacks.reduce((acc, f) => {
      acc[f.category] = (acc[f.category] || 0) + 1;
      return acc;
    }, {});

    const byStatus = feedbacks.reduce((acc, f) => {
      const status = f.resolved ? 'resolved' : f.status === 'inProgress' ? 'inProgress' : 'new';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, { new: 0, inProgress: 0, resolved: 0 });

    return new Response(
      JSON.stringify({
        feedbacks,
        total: feedbacks.length,
        byCategory,
        byStatus,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch feedback' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
