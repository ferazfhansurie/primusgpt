import { neon } from '@neondatabase/serverless';
//
export const config = {
  runtime: 'edge',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export default async function handler(request) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // Only allow POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const body = await request.json();

    const {
      event_type = 'pageview',
      page_path,
      referrer,
      user_agent,
      screen_width,
      screen_height,
      language,
      timezone,
      visitor_id,
    } = body;

    // Get IP and country from headers (Vercel provides these)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown';
    const country = request.headers.get('x-vercel-ip-country') || 'unknown';
    const city = request.headers.get('x-vercel-ip-city') || 'unknown';

    // Insert the event
    await sql`
      INSERT INTO analytics_events (
        event_type, page_path, referrer, user_agent,
        ip_address, country, city, screen_width, screen_height,
        language, timezone, visitor_id, created_at
      ) VALUES (
        ${event_type}, ${page_path}, ${referrer || 'direct'}, ${user_agent},
        ${ip}, ${country}, ${city}, ${screen_width || null}, ${screen_height || null},
        ${language || 'unknown'}, ${timezone || 'unknown'}, ${visitor_id}, NOW()
      )
    `;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('Analytics track error:', error);
    return new Response(JSON.stringify({ error: 'Failed to track event' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
