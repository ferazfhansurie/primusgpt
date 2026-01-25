import { neon } from '@neondatabase/serverless';

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
      page_title,
      referrer,
      user_agent,
      screen_width,
      screen_height,
      viewport_width,
      viewport_height,
      language,
      languages,
      timezone,
      visitor_id,
      session_id,
      session_duration,
      device_type,
      browser,
      os,
      connection_type,
      is_returning,
      color_depth,
      pixel_ratio,
      touch_support,
      utm_source,
      utm_medium,
      utm_campaign,
    } = body;

    // Get IP and country from headers (Vercel provides these)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown';
    const country = request.headers.get('x-vercel-ip-country') || 'unknown';
    const city = request.headers.get('x-vercel-ip-city') || 'unknown';
    const region = request.headers.get('x-vercel-ip-country-region') || 'unknown';

    // Insert the event with new fields
    await sql`
      INSERT INTO analytics_events (
        event_type, page_path, page_title, referrer, user_agent,
        ip_address, country, city, region, screen_width, screen_height,
        viewport_width, viewport_height, language, languages, timezone,
        visitor_id, session_id, session_duration, device_type, browser, os,
        connection_type, is_returning, color_depth, pixel_ratio, touch_support,
        utm_source, utm_medium, utm_campaign, created_at
      ) VALUES (
        ${event_type}, ${page_path}, ${page_title || null}, ${referrer || 'direct'}, ${user_agent},
        ${ip}, ${country}, ${city}, ${region}, ${screen_width || null}, ${screen_height || null},
        ${viewport_width || null}, ${viewport_height || null}, ${language || 'unknown'}, ${languages || null}, ${timezone || 'unknown'},
        ${visitor_id}, ${session_id || null}, ${session_duration || 0}, ${device_type || null}, ${browser || null}, ${os || null},
        ${connection_type || null}, ${is_returning || false}, ${color_depth || null}, ${pixel_ratio || null}, ${touch_support || false},
        ${utm_source || null}, ${utm_medium || null}, ${utm_campaign || null}, NOW()
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
