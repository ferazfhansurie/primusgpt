import { neon } from '@neondatabase/serverless';

export const config = {
  runtime: 'edge',
};

const ANALYTICS_PASSWORD = '!Demo123123';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

export default async function handler(request) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // Check password from Authorization header
  const authHeader = request.headers.get('authorization');
  const password = authHeader?.replace('Bearer ', '');

  if (password !== ANALYTICS_PASSWORD) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '7');

    // Calculate date range
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);

    // Get overview stats with session data
    const [overview] = await sql`
      SELECT
        COUNT(*) as total_pageviews,
        COUNT(DISTINCT visitor_id) as total_visitors,
        COUNT(DISTINCT session_id) as total_sessions,
        COUNT(DISTINCT CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN visitor_id END) as visitors_today,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as pageviews_today,
        COUNT(DISTINCT CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN visitor_id END) as visitors_week,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as pageviews_week,
        COALESCE(AVG(NULLIF(session_duration, 0)), 0) as avg_session_duration,
        COUNT(DISTINCT CASE WHEN is_returning = true THEN visitor_id END) as returning_visitors,
        COUNT(DISTINCT CASE WHEN is_returning = false OR is_returning IS NULL THEN visitor_id END) as new_visitors
      FROM analytics_events
      WHERE event_type = 'pageview'
    `;

    // Get pageviews by day
    const pageviewsByDay = await sql`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as pageviews,
        COUNT(DISTINCT visitor_id) as visitors,
        COUNT(DISTINCT session_id) as sessions
      FROM analytics_events
      WHERE created_at > ${daysAgo} AND event_type = 'pageview'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    // Get hourly traffic for today
    const hourlyTraffic = await sql`
      SELECT
        EXTRACT(HOUR FROM created_at) as hour,
        COUNT(*) as pageviews,
        COUNT(DISTINCT visitor_id) as visitors
      FROM analytics_events
      WHERE created_at > NOW() - INTERVAL '24 hours' AND event_type = 'pageview'
      GROUP BY hour
      ORDER BY hour
    `;

    // Get top pages
    const topPages = await sql`
      SELECT
        page_path,
        COUNT(*) as views,
        COUNT(DISTINCT visitor_id) as visitors,
        COALESCE(AVG(NULLIF(session_duration, 0)), 0) as avg_time
      FROM analytics_events
      WHERE created_at > ${daysAgo} AND event_type = 'pageview'
      GROUP BY page_path
      ORDER BY views DESC
      LIMIT 10
    `;

    // Get top referrers
    const topReferrers = await sql`
      SELECT
        CASE
          WHEN referrer = 'direct' OR referrer = '' OR referrer IS NULL THEN 'Direct'
          ELSE REGEXP_REPLACE(referrer, '^https?://([^/]+).*$', '\\1')
        END as source,
        COUNT(*) as visits,
        COUNT(DISTINCT visitor_id) as visitors
      FROM analytics_events
      WHERE created_at > ${daysAgo} AND event_type = 'pageview'
      GROUP BY source
      ORDER BY visits DESC
      LIMIT 10
    `;

    // Get countries
    const countries = await sql`
      SELECT
        country,
        COUNT(*) as visits,
        COUNT(DISTINCT visitor_id) as visitors
      FROM analytics_events
      WHERE created_at > ${daysAgo} AND country IS NOT NULL AND country != 'unknown' AND country != '' AND event_type = 'pageview'
      GROUP BY country
      ORDER BY visitors DESC
      LIMIT 15
    `;

    // Get cities (top 10)
    const cities = await sql`
      SELECT
        city,
        country,
        COUNT(*) as visits,
        COUNT(DISTINCT visitor_id) as visitors
      FROM analytics_events
      WHERE created_at > ${daysAgo} AND city IS NOT NULL AND city != 'unknown' AND city != '' AND event_type = 'pageview'
      GROUP BY city, country
      ORDER BY visitors DESC
      LIMIT 10
    `;

    // Get devices
    const devices = await sql`
      SELECT device, COUNT(*) as visits, COUNT(DISTINCT visitor_id) as visitors
      FROM (
        SELECT visitor_id,
          CASE
            WHEN device_type IS NOT NULL AND device_type != '' THEN device_type
            WHEN user_agent ILIKE '%mobile%' OR user_agent ILIKE '%android%' OR user_agent ILIKE '%iphone%' THEN 'Mobile'
            WHEN user_agent ILIKE '%tablet%' OR user_agent ILIKE '%ipad%' THEN 'Tablet'
            ELSE 'Desktop'
          END as device
        FROM analytics_events
        WHERE created_at > ${daysAgo} AND event_type = 'pageview'
      ) sub
      GROUP BY device
      ORDER BY visits DESC
    `;

    // Get browsers
    const browsers = await sql`
      SELECT browser, COUNT(*) as visits, COUNT(DISTINCT visitor_id) as visitors
      FROM (
        SELECT visitor_id,
          CASE
            WHEN browser IS NOT NULL AND browser != '' THEN browser
            WHEN user_agent ILIKE '%chrome%' AND user_agent NOT ILIKE '%edg%' THEN 'Chrome'
            WHEN user_agent ILIKE '%firefox%' THEN 'Firefox'
            WHEN user_agent ILIKE '%safari%' AND user_agent NOT ILIKE '%chrome%' THEN 'Safari'
            WHEN user_agent ILIKE '%edg%' THEN 'Edge'
            WHEN user_agent ILIKE '%opera%' OR user_agent ILIKE '%opr%' THEN 'Opera'
            ELSE 'Other'
          END as browser
        FROM analytics_events
        WHERE created_at > ${daysAgo} AND event_type = 'pageview'
      ) sub
      GROUP BY browser
      ORDER BY visits DESC
    `;

    // Get OS
    const operatingSystems = await sql`
      SELECT os, COUNT(*) as visits, COUNT(DISTINCT visitor_id) as visitors
      FROM (
        SELECT visitor_id,
          CASE
            WHEN os IS NOT NULL AND os != '' THEN os
            WHEN user_agent ILIKE '%windows%' THEN 'Windows'
            WHEN user_agent ILIKE '%mac%' THEN 'macOS'
            WHEN user_agent ILIKE '%linux%' AND user_agent NOT ILIKE '%android%' THEN 'Linux'
            WHEN user_agent ILIKE '%android%' THEN 'Android'
            WHEN user_agent ILIKE '%iphone%' OR user_agent ILIKE '%ipad%' THEN 'iOS'
            ELSE 'Other'
          END as os
        FROM analytics_events
        WHERE created_at > ${daysAgo} AND event_type = 'pageview'
      ) sub
      GROUP BY os
      ORDER BY visits DESC
    `;

    // Get languages
    const languages = await sql`
      SELECT
        SPLIT_PART(language, '-', 1) as lang,
        COUNT(*) as visits,
        COUNT(DISTINCT visitor_id) as visitors
      FROM analytics_events
      WHERE created_at > ${daysAgo} AND language IS NOT NULL AND language != 'unknown' AND event_type = 'pageview'
      GROUP BY lang
      ORDER BY visitors DESC
      LIMIT 10
    `;

    // Get screen sizes grouped
    const screenSizes = await sql`
      SELECT
        CASE
          WHEN screen_width >= 1920 THEN '1920+ (Large Desktop)'
          WHEN screen_width >= 1440 THEN '1440-1919 (Desktop)'
          WHEN screen_width >= 1024 THEN '1024-1439 (Laptop)'
          WHEN screen_width >= 768 THEN '768-1023 (Tablet)'
          WHEN screen_width >= 375 THEN '375-767 (Mobile)'
          ELSE '< 375 (Small Mobile)'
        END as size_group,
        COUNT(*) as visits,
        COUNT(DISTINCT visitor_id) as visitors
      FROM analytics_events
      WHERE created_at > ${daysAgo} AND screen_width IS NOT NULL AND event_type = 'pageview'
      GROUP BY size_group
      ORDER BY visitors DESC
    `;

    // Get connection types
    const connectionTypes = await sql`
      SELECT
        COALESCE(NULLIF(connection_type, ''), 'unknown') as connection,
        COUNT(*) as visits,
        COUNT(DISTINCT visitor_id) as visitors
      FROM analytics_events
      WHERE created_at > ${daysAgo} AND event_type = 'pageview'
      GROUP BY connection
      ORDER BY visitors DESC
    `;

    // Get UTM campaigns if any
    const utmCampaigns = await sql`
      SELECT
        utm_source,
        utm_medium,
        utm_campaign,
        COUNT(*) as visits,
        COUNT(DISTINCT visitor_id) as visitors
      FROM analytics_events
      WHERE created_at > ${daysAgo} AND utm_source IS NOT NULL AND event_type = 'pageview'
      GROUP BY utm_source, utm_medium, utm_campaign
      ORDER BY visitors DESC
      LIMIT 10
    `;

    // Get recent visitors (last 50)
    const recentVisitors = await sql`
      SELECT
        visitor_id,
        page_path,
        referrer,
        country,
        city,
        COALESCE(device_type,
          CASE
            WHEN user_agent ILIKE '%mobile%' OR user_agent ILIKE '%android%' OR user_agent ILIKE '%iphone%' THEN 'Mobile'
            ELSE 'Desktop'
          END
        ) as device,
        browser,
        os,
        session_duration,
        is_returning,
        created_at
      FROM analytics_events
      WHERE event_type = 'pageview'
      ORDER BY created_at DESC
      LIMIT 50
    `;

    // Get live visitors (last 5 minutes)
    const [liveVisitors] = await sql`
      SELECT COUNT(DISTINCT visitor_id) as count
      FROM analytics_events
      WHERE created_at > NOW() - INTERVAL '5 minutes' AND event_type = 'pageview'
    `;

    // Get user stats from users table
    const [userStats] = await sql`
      SELECT
        COUNT(*) as total_users,
        COUNT(CASE WHEN payment_status = 'active' THEN 1 END) as paid_users,
        COUNT(CASE WHEN subscription_status = 'trialing' THEN 1 END) as trial_users,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as new_users_today,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as new_users_week,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as new_users_month
      FROM users
    `;

    // Get subscription breakdown
    const subscriptionStats = await sql`
      SELECT
        subscription_plan,
        COUNT(*) as count,
        COALESCE(SUM(payment_amount), 0) / 100.0 as total_revenue
      FROM users
      WHERE subscription_plan IS NOT NULL AND payment_status = 'active'
      GROUP BY subscription_plan
      ORDER BY count DESC
    `;

    // Get recent registrations
    const recentUsers = await sql`
      SELECT
        id,
        COALESCE(first_name, telegram_first_name, 'User') as name,
        email,
        subscription_plan,
        payment_status,
        created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 10
    `;

    // Get analysis stats
    const [analysisStats] = await sql`
      SELECT
        COUNT(*) as total_analyses,
        COUNT(CASE WHEN is_valid THEN 1 END) as valid_setups,
        COUNT(CASE WHEN signal = 'buy' THEN 1 END) as buy_signals,
        COUNT(CASE WHEN signal = 'sell' THEN 1 END) as sell_signals,
        COALESCE(AVG(confidence), 0) as avg_confidence
      FROM analysis_history
    `;

    // Get popular trading pairs
    const popularPairs = await sql`
      SELECT
        pair,
        COUNT(*) as analyses,
        COALESCE(AVG(confidence), 0) as avg_confidence
      FROM analysis_history
      WHERE created_at > ${daysAgo}
      GROUP BY pair
      ORDER BY analyses DESC
      LIMIT 10
    `;

    // Get revenue summary
    const [revenueStats] = await sql`
      SELECT
        COALESCE(SUM(CASE WHEN payment_status = 'active' THEN payment_amount END), 0) / 100.0 as total_revenue,
        COALESCE(SUM(CASE WHEN payment_status = 'active' AND subscription_plan = 'monthly' THEN payment_amount END), 0) / 100.0 as monthly_revenue,
        COALESCE(SUM(CASE WHEN payment_status = 'active' AND subscription_plan = 'annual' THEN payment_amount END), 0) / 100.0 as annual_revenue
      FROM users
    `;

    return new Response(JSON.stringify({
      success: true,
      data: {
        overview: {
          totalPageviews: parseInt(overview?.total_pageviews) || 0,
          totalVisitors: parseInt(overview?.total_visitors) || 0,
          totalSessions: parseInt(overview?.total_sessions) || 0,
          visitorsToday: parseInt(overview?.visitors_today) || 0,
          pageviewsToday: parseInt(overview?.pageviews_today) || 0,
          visitorsWeek: parseInt(overview?.visitors_week) || 0,
          pageviewsWeek: parseInt(overview?.pageviews_week) || 0,
          avgSessionDuration: parseFloat(overview?.avg_session_duration) || 0,
          returningVisitors: parseInt(overview?.returning_visitors) || 0,
          newVisitors: parseInt(overview?.new_visitors) || 0,
          liveVisitors: parseInt(liveVisitors?.count) || 0,
        },
        users: {
          totalUsers: parseInt(userStats?.total_users) || 0,
          paidUsers: parseInt(userStats?.paid_users) || 0,
          trialUsers: parseInt(userStats?.trial_users) || 0,
          newUsersToday: parseInt(userStats?.new_users_today) || 0,
          newUsersWeek: parseInt(userStats?.new_users_week) || 0,
          newUsersMonth: parseInt(userStats?.new_users_month) || 0,
        },
        revenue: {
          totalRevenue: parseFloat(revenueStats?.total_revenue) || 0,
          monthlyRevenue: parseFloat(revenueStats?.monthly_revenue) || 0,
          annualRevenue: parseFloat(revenueStats?.annual_revenue) || 0,
        },
        analysis: {
          totalAnalyses: parseInt(analysisStats?.total_analyses) || 0,
          validSetups: parseInt(analysisStats?.valid_setups) || 0,
          buySignals: parseInt(analysisStats?.buy_signals) || 0,
          sellSignals: parseInt(analysisStats?.sell_signals) || 0,
          avgConfidence: parseFloat(analysisStats?.avg_confidence) || 0,
        },
        pageviewsByDay,
        hourlyTraffic,
        topPages,
        topReferrers,
        countries,
        cities,
        devices,
        browsers,
        operatingSystems,
        languages,
        screenSizes,
        connectionTypes,
        utmCampaigns,
        recentVisitors,
        recentUsers,
        subscriptionStats,
        popularPairs,
      },
    }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('Analytics data error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch analytics', details: error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
