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

    // Get overview stats
    const [overview] = await sql`
      SELECT
        COUNT(*) as total_pageviews,
        COUNT(DISTINCT visitor_id) as total_visitors,
        COUNT(DISTINCT CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN visitor_id END) as visitors_today,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as pageviews_today,
        COUNT(DISTINCT CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN visitor_id END) as visitors_week,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as pageviews_week
      FROM analytics_events
    `;

    // Get pageviews by day
    const pageviewsByDay = await sql`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as pageviews,
        COUNT(DISTINCT visitor_id) as visitors
      FROM analytics_events
      WHERE created_at > ${daysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    // Get top pages
    const topPages = await sql`
      SELECT
        page_path,
        COUNT(*) as views,
        COUNT(DISTINCT visitor_id) as visitors
      FROM analytics_events
      WHERE created_at > ${daysAgo}
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
      WHERE created_at > ${daysAgo}
      GROUP BY source
      ORDER BY visits DESC
      LIMIT 10
    `;

    // Get countries with flag emojis
    const countries = await sql`
      SELECT
        country,
        COUNT(*) as visits,
        COUNT(DISTINCT visitor_id) as visitors
      FROM analytics_events
      WHERE created_at > ${daysAgo} AND country IS NOT NULL AND country != 'unknown' AND country != ''
      GROUP BY country
      ORDER BY visitors DESC
      LIMIT 15
    `;

    // Get devices
    const devices = await sql`
      SELECT
        CASE
          WHEN user_agent ILIKE '%mobile%' OR user_agent ILIKE '%android%' OR user_agent ILIKE '%iphone%' THEN 'Mobile'
          WHEN user_agent ILIKE '%tablet%' OR user_agent ILIKE '%ipad%' THEN 'Tablet'
          ELSE 'Desktop'
        END as device,
        COUNT(*) as visits,
        COUNT(DISTINCT visitor_id) as visitors
      FROM analytics_events
      WHERE created_at > ${daysAgo}
      GROUP BY device
      ORDER BY visits DESC
    `;

    // Get browsers
    const browsers = await sql`
      SELECT
        CASE
          WHEN user_agent ILIKE '%chrome%' AND user_agent NOT ILIKE '%edg%' THEN 'Chrome'
          WHEN user_agent ILIKE '%firefox%' THEN 'Firefox'
          WHEN user_agent ILIKE '%safari%' AND user_agent NOT ILIKE '%chrome%' THEN 'Safari'
          WHEN user_agent ILIKE '%edg%' THEN 'Edge'
          WHEN user_agent ILIKE '%opera%' OR user_agent ILIKE '%opr%' THEN 'Opera'
          ELSE 'Other'
        END as browser,
        COUNT(*) as visits,
        COUNT(DISTINCT visitor_id) as visitors
      FROM analytics_events
      WHERE created_at > ${daysAgo}
      GROUP BY browser
      ORDER BY visits DESC
    `;

    // Get OS
    const operatingSystems = await sql`
      SELECT
        CASE
          WHEN user_agent ILIKE '%windows%' THEN 'Windows'
          WHEN user_agent ILIKE '%mac%' THEN 'macOS'
          WHEN user_agent ILIKE '%linux%' AND user_agent NOT ILIKE '%android%' THEN 'Linux'
          WHEN user_agent ILIKE '%android%' THEN 'Android'
          WHEN user_agent ILIKE '%iphone%' OR user_agent ILIKE '%ipad%' THEN 'iOS'
          ELSE 'Other'
        END as os,
        COUNT(*) as visits,
        COUNT(DISTINCT visitor_id) as visitors
      FROM analytics_events
      WHERE created_at > ${daysAgo}
      GROUP BY os
      ORDER BY visits DESC
    `;

    // Get recent visitors (last 50)
    const recentVisitors = await sql`
      SELECT
        visitor_id,
        page_path,
        referrer,
        country,
        city,
        CASE
          WHEN user_agent ILIKE '%mobile%' OR user_agent ILIKE '%android%' OR user_agent ILIKE '%iphone%' THEN 'Mobile'
          ELSE 'Desktop'
        END as device,
        created_at
      FROM analytics_events
      ORDER BY created_at DESC
      LIMIT 50
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
          visitorsToday: parseInt(overview?.visitors_today) || 0,
          pageviewsToday: parseInt(overview?.pageviews_today) || 0,
          visitorsWeek: parseInt(overview?.visitors_week) || 0,
          pageviewsWeek: parseInt(overview?.pageviews_week) || 0,
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
        topPages,
        topReferrers,
        countries,
        devices,
        browsers,
        operatingSystems,
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
