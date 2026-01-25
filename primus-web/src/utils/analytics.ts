interface PageView {
  path: string;
  timestamp: number;
  referrer: string;
  userAgent: string;
}

interface AnalyticsData {
  pageViews: PageView[];
  visitors: { [visitorId: string]: { firstVisit: number; lastVisit: number; visits: number } };
}

const STORAGE_KEY = 'primusgpt_analytics';

function getVisitorId(): string {
  let visitorId = localStorage.getItem('primusgpt_visitor_id');
  if (!visitorId) {
    visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('primusgpt_visitor_id', visitorId);
  }
  return visitorId;
}

export function getAnalyticsData(): AnalyticsData {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : { pageViews: [], visitors: {} };
  } catch {
    return { pageViews: [], visitors: {} };
  }
}

function saveAnalyticsData(data: AnalyticsData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function trackPageView(path: string): void {
  const data = getAnalyticsData();
  const visitorId = getVisitorId();
  const now = Date.now();

  // Add page view
  data.pageViews.push({
    path,
    timestamp: now,
    referrer: document.referrer || 'direct',
    userAgent: navigator.userAgent,
  });

  // Keep only last 1000 page views
  if (data.pageViews.length > 1000) {
    data.pageViews = data.pageViews.slice(-1000);
  }

  // Update visitor data
  if (data.visitors[visitorId]) {
    data.visitors[visitorId].lastVisit = now;
    data.visitors[visitorId].visits += 1;
  } else {
    data.visitors[visitorId] = {
      firstVisit: now,
      lastVisit: now,
      visits: 1,
    };
  }

  saveAnalyticsData(data);
}

export function getAnalyticsSummary() {
  const data = getAnalyticsData();
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  const pageViewsToday = data.pageViews.filter(pv => pv.timestamp > oneDayAgo).length;
  const pageViews7Days = data.pageViews.filter(pv => pv.timestamp > sevenDaysAgo).length;
  const pageViews30Days = data.pageViews.filter(pv => pv.timestamp > thirtyDaysAgo).length;

  const visitorsToday = Object.values(data.visitors).filter(v => v.lastVisit > oneDayAgo).length;
  const visitors7Days = Object.values(data.visitors).filter(v => v.lastVisit > sevenDaysAgo).length;
  const visitors30Days = Object.values(data.visitors).filter(v => v.lastVisit > thirtyDaysAgo).length;

  // Top pages
  const pageCounts: { [key: string]: number } = {};
  data.pageViews.filter(pv => pv.timestamp > sevenDaysAgo).forEach(pv => {
    pageCounts[pv.path] = (pageCounts[pv.path] || 0) + 1;
  });
  const topPages = Object.entries(pageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Referrers
  const referrerCounts: { [key: string]: number } = {};
  data.pageViews.filter(pv => pv.timestamp > sevenDaysAgo).forEach(pv => {
    const ref = pv.referrer || 'direct';
    referrerCounts[ref] = (referrerCounts[ref] || 0) + 1;
  });
  const topReferrers = Object.entries(referrerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return {
    pageViews: { today: pageViewsToday, week: pageViews7Days, month: pageViews30Days },
    visitors: { today: visitorsToday, week: visitors7Days, month: visitors30Days },
    topPages,
    topReferrers,
    totalPageViews: data.pageViews.length,
    totalVisitors: Object.keys(data.visitors).length,
  };
}

export function clearAnalytics(): void {
  localStorage.removeItem(STORAGE_KEY);
}
