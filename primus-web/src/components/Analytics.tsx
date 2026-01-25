import { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { format } from 'date-fns';

const ANALYTICS_PASSWORD = 'P@ssw0rd';
const API_URL = import.meta.env.PROD
  ? '/api/analytics/data'
  : 'https://primusgpt-ai.vercel.app/api/analytics/data';

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];

const countryFlags: { [key: string]: string } = {
  'MY': '🇲🇾', 'US': '🇺🇸', 'GB': '🇬🇧', 'SG': '🇸🇬', 'IN': '🇮🇳', 'AU': '🇦🇺',
  'DE': '🇩🇪', 'FR': '🇫🇷', 'JP': '🇯🇵', 'KR': '🇰🇷', 'CN': '🇨🇳', 'ID': '🇮🇩',
  'TH': '🇹🇭', 'VN': '🇻🇳', 'PH': '🇵🇭', 'BR': '🇧🇷', 'CA': '🇨🇦', 'NL': '🇳🇱',
  'IT': '🇮🇹', 'ES': '🇪🇸', 'RU': '🇷🇺', 'AE': '🇦🇪', 'SA': '🇸🇦', 'NZ': '🇳🇿',
  'HK': '🇭🇰', 'TW': '🇹🇼', 'PK': '🇵🇰', 'BD': '🇧🇩', 'NG': '🇳🇬', 'ZA': '🇿🇦',
  'MX': '🇲🇽', 'AR': '🇦🇷', 'CO': '🇨🇴', 'CL': '🇨🇱', 'PE': '🇵🇪', 'EG': '🇪🇬',
  'TR': '🇹🇷', 'PL': '🇵🇱', 'SE': '🇸🇪', 'NO': '🇳🇴', 'DK': '🇩🇰', 'FI': '🇫🇮',
  'IE': '🇮🇪', 'CH': '🇨🇭', 'AT': '🇦🇹', 'BE': '🇧🇪', 'PT': '🇵🇹', 'GR': '🇬🇷',
};

const languageNames: { [key: string]: string } = {
  'en': 'English', 'ms': 'Malay', 'zh': 'Chinese', 'ja': 'Japanese', 'ko': 'Korean',
  'es': 'Spanish', 'fr': 'French', 'de': 'German', 'pt': 'Portuguese', 'ru': 'Russian',
  'ar': 'Arabic', 'hi': 'Hindi', 'id': 'Indonesian', 'th': 'Thai', 'vi': 'Vietnamese',
};

const getFlag = (country: string) => countryFlags[country] || '🌍';
const getLangName = (code: string) => languageNames[code] || code.toUpperCase();

const formatDuration = (seconds: number) => {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
};

interface AnalyticsData {
  overview: {
    totalPageviews: number;
    totalVisitors: number;
    totalSessions: number;
    visitorsToday: number;
    pageviewsToday: number;
    visitorsWeek: number;
    pageviewsWeek: number;
    avgSessionDuration: number;
    returningVisitors: number;
    newVisitors: number;
    liveVisitors: number;
  };
  users: {
    totalUsers: number;
    paidUsers: number;
    trialUsers: number;
    newUsersToday: number;
    newUsersWeek: number;
    newUsersMonth: number;
  };
  revenue: {
    totalRevenue: number;
    monthlyRevenue: number;
    annualRevenue: number;
  };
  analysis: {
    totalAnalyses: number;
    validSetups: number;
    buySignals: number;
    sellSignals: number;
    avgConfidence: number;
  };
  pageviewsByDay: Array<{ date: string; pageviews: number; visitors: number; sessions: number }>;
  hourlyTraffic: Array<{ hour: number; pageviews: number; visitors: number }>;
  topPages: Array<{ page_path: string; views: number; visitors: number; avg_time: number }>;
  topReferrers: Array<{ source: string; visits: number; visitors: number }>;
  countries: Array<{ country: string; visits: number; visitors: number }>;
  cities: Array<{ city: string; country: string; visits: number; visitors: number }>;
  devices: Array<{ device: string; visits: number; visitors: number }>;
  browsers: Array<{ browser: string; visits: number; visitors: number }>;
  operatingSystems: Array<{ os: string; visits: number; visitors: number }>;
  languages: Array<{ lang: string; visits: number; visitors: number }>;
  screenSizes: Array<{ size_group: string; visits: number; visitors: number }>;
  connectionTypes: Array<{ connection: string; visits: number; visitors: number }>;
  utmCampaigns: Array<{ utm_source: string; utm_medium: string; utm_campaign: string; visits: number; visitors: number }>;
  recentVisitors: Array<{
    visitor_id: string;
    page_path: string;
    referrer: string;
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    country: string;
    city: string;
    device: string;
    browser: string;
    os: string;
    session_duration: number;
    is_returning: boolean;
    created_at: string;
  }>;
  recentUsers: Array<{
    id: number;
    name: string;
    email: string;
    subscription_plan: string;
    payment_status: string;
    created_at: string;
  }>;
  subscriptionStats: Array<{ subscription_plan: string; count: number; total_revenue: number }>;
  popularPairs: Array<{ pair: string; analyses: number; avg_confidence: number }>;
}

export default function Analytics() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState(7);
  const [activeSection, setActiveSection] = useState<'site' | 'database'>('site');

  useEffect(() => {
    const stored = sessionStorage.getItem('analytics_auth');
    if (stored === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, timeRange]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, timeRange]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}?days=${timeRange}`, {
        headers: { Authorization: `Bearer ${ANALYTICS_PASSWORD}` },
      });
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to load data');
      }
    } catch (err) {
      setError('Failed to connect to analytics server');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ANALYTICS_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('analytics_auth', 'true');
      setError('');
    } else {
      setError('Incorrect password');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-logo">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v18h18" />
                <path d="M18 9l-5-6-4 8-3-4" />
              </svg>
            </div>
          </div>
          <h1 className="login-title">Analytics</h1>
          <p className="login-subtitle">Enter password to access dashboard</p>
          <form onSubmit={handleLogin} className="login-form">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="login-input"
              autoFocus
            />
            {error && <p className="login-error">{error}</p>}
            <button type="submit" className="login-button">
              Access Dashboard
            </button>
          </form>
        </div>
        <style>{loginStyles}</style>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p className="loading-text">Loading analytics...</p>
        <style>{loadingStyles}</style>
      </div>
    );
  }

  const totalVisitorsForPercent = data?.countries.reduce((sum, c) => sum + Number(c.visitors), 0) || 1;

  // Prepare hourly data with all 24 hours
  const fullHourlyData = Array.from({ length: 24 }, (_, i) => {
    const found = data?.hourlyTraffic?.find(h => Number(h.hour) === i);
    return {
      hour: i,
      label: `${i.toString().padStart(2, '0')}:00`,
      pageviews: found ? Number(found.pageviews) : 0,
      visitors: found ? Number(found.visitors) : 0,
    };
  });

  return (
    <div className="analytics-container">
      <style>{dashboardStyles}</style>

      {/* Header */}
      <header className="header">
        <div className="header-left">
          <h1 className="header-title">
            <span className="header-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                <path d="M3 3v18h18" />
                <path d="M18 9l-5-6-4 8-3-4" />
              </svg>
            </span>
            Analytics
          </h1>
          {data && data.overview.liveVisitors > 0 && (
            <span className="live-badge">
              <span className="live-dot" />
              {data.overview.liveVisitors} live
            </span>
          )}
        </div>
        <div className="header-right">
          <select value={timeRange} onChange={(e) => setTimeRange(parseInt(e.target.value))} className="time-select">
            <option value={1}>Today</option>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button onClick={fetchData} className="refresh-btn" disabled={loading}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" className={loading ? 'spin' : ''}>
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
            Refresh
          </button>
        </div>
      </header>

      {/* Section Tabs */}
      <nav className="section-tabs">
        <button
          onClick={() => setActiveSection('site')}
          className={`section-tab ${activeSection === 'site' ? 'active' : ''}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
          </svg>
          Site Tracking
        </button>
        <button
          onClick={() => setActiveSection('database')}
          className={`section-tab ${activeSection === 'database' ? 'active' : ''}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          </svg>
          Database
        </button>
      </nav>

      {error && <div className="error-banner">{error}</div>}

      <main className="main">
        {/* SITE TRACKING SECTION */}
        {activeSection === 'site' && data && (
          <>
            {/* Overview Stats */}
            <div className="stats-grid">
              <StatCard
                title="Total Visitors"
                value={data.overview.totalVisitors}
                subValue={`+${data.overview.visitorsToday} today`}
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>}
                color="purple"
              />
              <StatCard
                title="Page Views"
                value={data.overview.totalPageviews}
                subValue={`+${data.overview.pageviewsToday} today`}
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>}
                color="cyan"
              />
              <StatCard
                title="Avg. Session"
                value={formatDuration(data.overview.avgSessionDuration)}
                subValue="duration"
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>}
                color="green"
                isText
              />
              <StatCard
                title="Returning"
                value={data.overview.totalVisitors > 0 ? Math.round((data.overview.returningVisitors / data.overview.totalVisitors) * 100) : 0}
                subValue="% of visitors"
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 14l-4-4 4-4" /><path d="M5 10h11a4 4 0 110 8h-1" /></svg>}
                color="orange"
                isPercent
              />
            </div>

            {/* Recent Visitors - Most important for marketing */}
            <div className="card">
              <h3 className="card-title">
                <span>Recent Visitors</span>
                <span className="card-subtitle">{data.recentVisitors.length} unique visitors</span>
              </h3>
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Page</th>
                      <th>Came From</th>
                      <th>Location</th>
                      <th>Device</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentVisitors.length > 0 ? data.recentVisitors.slice(0, 25).map((v, i) => {
                      // Get source - prioritize UTM params over referrer
                      const getSource = () => {
                        // First check UTM source (most reliable for marketing)
                        if (v.utm_source) {
                          const src = v.utm_source.toLowerCase();
                          const medium = (v.utm_medium || '').toLowerCase();
                          const isInApp = medium === 'in-app';
                          if (src.includes('google') && medium === 'cpc') return '💰 Google Ads';
                          if (src.includes('google')) return '🔍 Google';
                          if (src.includes('facebook') || src.includes('fb') || src === 'facebook') return isInApp ? '📱 Facebook App' : '📘 Facebook';
                          if (src.includes('instagram') || src === 'ig' || src === 'instagram') return isInApp ? '📱 Instagram App' : '📷 Instagram';
                          if (src.includes('twitter') || src === 'x' || src === 'twitter') return isInApp ? '📱 Twitter App' : '𝕏 Twitter/X';
                          if (src.includes('tiktok') || src === 'tiktok') return isInApp ? '📱 TikTok App' : '🎵 TikTok';
                          if (src.includes('youtube') || src === 'yt') return '▶️ YouTube';
                          if (src.includes('linkedin') || src === 'linkedin') return isInApp ? '📱 LinkedIn App' : '💼 LinkedIn';
                          if (src.includes('telegram') || src === 'tg' || src === 'telegram') return isInApp ? '📱 Telegram App' : '✈️ Telegram';
                          if (src.includes('whatsapp') || src === 'wa' || src === 'whatsapp') return isInApp ? '📱 WhatsApp' : '💬 WhatsApp';
                          if (src.includes('snapchat') || src === 'snapchat') return '👻 Snapchat';
                          if (src.includes('pinterest') || src === 'pinterest') return '📌 Pinterest';
                          if (src.includes('line') || src === 'line') return '💚 Line';
                          if (src.includes('wechat') || src === 'wechat') return '💬 WeChat';
                          if (src.includes('reddit')) return '🤖 Reddit';
                          if (src.includes('email') || src.includes('newsletter')) return '📧 Email';
                          if (medium === 'cpc' || medium === 'paid') return `💰 ${v.utm_source}`;
                          if (isInApp) return `📱 ${v.utm_source}`;
                          return `📢 ${v.utm_source}`;
                        }
                        // Fall back to referrer
                        const ref = v.referrer;
                        if (!ref || ref === 'direct' || ref === '') return '🔗 Direct';
                        try {
                          const url = new URL(ref);
                          const host = url.hostname.replace('www.', '');
                          if (host.includes('google')) return '🔍 Google';
                          if (host.includes('facebook') || host.includes('fb.')) return '📘 Facebook';
                          if (host.includes('instagram')) return '📷 Instagram';
                          if (host.includes('twitter') || host.includes('x.com')) return '𝕏 Twitter/X';
                          if (host.includes('tiktok')) return '🎵 TikTok';
                          if (host.includes('youtube')) return '▶️ YouTube';
                          if (host.includes('linkedin')) return '💼 LinkedIn';
                          if (host.includes('telegram')) return '✈️ Telegram';
                          if (host.includes('whatsapp')) return '💬 WhatsApp';
                          if (host.includes('reddit')) return '🤖 Reddit';
                          return `🌐 ${host}`;
                        } catch {
                          return '🔗 Direct';
                        }
                      };
                      return (
                        <tr key={i}>
                          <td className="nowrap">{format(new Date(v.created_at), 'MMM d, HH:mm')}</td>
                          <td className="truncate">{v.page_path}</td>
                          <td className="nowrap">{getSource()}</td>
                          <td className="nowrap">{getFlag(v.country)} {v.city !== 'unknown' ? decodeURIComponent(v.city) : v.country}</td>
                          <td><span className={`badge ${v.device === 'Mobile' ? 'badge-purple' : 'badge-cyan'}`}>{v.device}</span></td>
                          <td><span className={`badge ${v.is_returning ? 'badge-green' : 'badge-orange'}`}>{v.is_returning ? 'Returning' : 'New'}</span></td>
                        </tr>
                      );
                    }) : <tr><td colSpan={6} className="no-data-cell">No visitors yet</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Traffic Chart - Show hourly when limited daily data */}
            <div className="card">
              <h3 className="card-title">Traffic Overview {data.pageviewsByDay.length <= 2 ? '(Hourly)' : ''}</h3>
              {(timeRange === 1 || data.pageviewsByDay.length <= 2) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={fullHourlyData}>
                    <defs>
                      <linearGradient id="colorHourlyVisitors" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      </linearGradient>
                      <linearGradient id="colorHourlyPageviews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.4} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="label" stroke="rgba(255,255,255,0.4)" fontSize={10} interval={2} />
                    <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                    <Tooltip
                      contentStyle={{ background: 'rgba(15, 15, 25, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                    />
                    <Legend />
                    <Bar dataKey="visitors" fill="url(#colorHourlyVisitors)" radius={[4, 4, 0, 0]} name="Visitors" />
                    <Bar dataKey="pageviews" fill="url(#colorHourlyPageviews)" radius={[4, 4, 0, 0]} name="Page Views" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.pageviewsByDay.slice().reverse()}>
                    <defs>
                      <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorPageviews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" tickFormatter={(val) => format(new Date(val), 'MMM d')} fontSize={11} />
                    <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                    <Tooltip
                      contentStyle={{ background: 'rgba(15, 15, 25, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                      labelFormatter={(val) => format(new Date(val), 'MMMM d, yyyy')}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="visitors" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorVisitors)" name="Visitors" />
                    <Area type="monotone" dataKey="pageviews" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorPageviews)" name="Page Views" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Hourly Traffic - Only show when viewing more than 1 day */}
            {timeRange > 1 && (
              <div className="card">
                <h3 className="card-title">Hourly Traffic (Last 24h)</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={fullHourlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="label" stroke="rgba(255,255,255,0.4)" fontSize={10} interval={2} />
                    <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                    <Tooltip
                      contentStyle={{ background: 'rgba(15, 15, 25, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    />
                    <Bar dataKey="visitors" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Visitors" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Countries & Cities */}
            <div className="two-column">
              <div className="card">
                <h3 className="card-title">Countries</h3>
                <div className="countries-list">
                  {data.countries.length > 0 ? data.countries.slice(0, 10).map((c, i) => (
                    <div key={i} className="country-row">
                      <div className="country-info">
                        <span className="country-flag">{getFlag(c.country)}</span>
                        <span className="country-name">{c.country}</span>
                      </div>
                      <div className="country-stats">
                        <div className="country-bar">
                          <div className="country-bar-fill" style={{ width: `${(Number(c.visitors) / totalVisitorsForPercent) * 100}%` }} />
                        </div>
                        <span className="country-value">{c.visitors}</span>
                      </div>
                    </div>
                  )) : <div className="no-data">No country data yet</div>}
                </div>
              </div>

              <div className="card">
                <h3 className="card-title">Top Cities</h3>
                <div className="countries-list">
                  {data.cities?.length > 0 ? data.cities.slice(0, 10).map((c, i) => (
                    <div key={i} className="country-row">
                      <div className="country-info">
                        <span className="country-flag">{getFlag(c.country)}</span>
                        <span className="country-name">{decodeURIComponent(c.city)}</span>
                      </div>
                      <div className="country-stats">
                        <span className="country-value">{c.visitors}</span>
                      </div>
                    </div>
                  )) : <div className="no-data">No city data yet</div>}
                </div>
              </div>
            </div>

            {/* Browsers & OS */}
            <div className="two-column">
              <div className="card">
                <h3 className="card-title">Browsers</h3>
                {data.browsers.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={data.browsers} dataKey="visitors" nameKey="browser" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                        {data.browsers.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'rgba(15, 15, 25, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="no-data">No data</div>}
              </div>

              <div className="card">
                <h3 className="card-title">Operating Systems</h3>
                {data.operatingSystems.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={data.operatingSystems} dataKey="visitors" nameKey="os" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                        {data.operatingSystems.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'rgba(15, 15, 25, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="no-data">No data</div>}
              </div>
            </div>

            {/* Languages & Screen Sizes */}
            <div className="two-column">
              <div className="card">
                <h3 className="card-title">Languages</h3>
                {data.languages?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={data.languages.slice(0, 6)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis type="number" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                      <YAxis dataKey="lang" type="category" stroke="rgba(255,255,255,0.4)" fontSize={11} width={60} tickFormatter={getLangName} />
                      <Tooltip contentStyle={{ background: 'rgba(15, 15, 25, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                      <Bar dataKey="visitors" fill="#10b981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="no-data">No language data</div>}
              </div>

              <div className="card">
                <h3 className="card-title">Screen Sizes</h3>
                {data.screenSizes?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={data.screenSizes}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="size_group" stroke="rgba(255,255,255,0.4)" fontSize={9} angle={-20} textAnchor="end" height={60} />
                      <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                      <Tooltip contentStyle={{ background: 'rgba(15, 15, 25, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                      <Bar dataKey="visitors" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="no-data">No screen data</div>}
              </div>
            </div>

            {/* Pages & Referrers */}
            <div className="two-column">
              <div className="card">
                <h3 className="card-title">Top Pages</h3>
                <div className="table-scroll">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Page</th>
                        <th style={{ textAlign: 'right' }}>Views</th>
                        <th style={{ textAlign: 'right' }}>Visitors</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topPages.length > 0 ? data.topPages.map((p, i) => (
                        <tr key={i}>
                          <td className="truncate">{p.page_path}</td>
                          <td style={{ textAlign: 'right' }}>{p.views}</td>
                          <td style={{ textAlign: 'right' }}>{p.visitors}</td>
                        </tr>
                      )) : <tr><td colSpan={3} className="no-data-cell">No data</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <h3 className="card-title">Traffic Sources</h3>
                <div className="table-scroll">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Source</th>
                        <th style={{ textAlign: 'right' }}>Visits</th>
                        <th style={{ textAlign: 'right' }}>Visitors</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topReferrers.length > 0 ? data.topReferrers.map((r, i) => (
                        <tr key={i}>
                          <td className="truncate">{r.source}</td>
                          <td style={{ textAlign: 'right' }}>{r.visits}</td>
                          <td style={{ textAlign: 'right' }}>{r.visitors}</td>
                        </tr>
                      )) : <tr><td colSpan={3} className="no-data-cell">No data</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        {/* DATABASE SECTION */}
        {activeSection === 'database' && data && (
          <>
            {/* User Stats */}
            <div className="stats-grid">
              <StatCard
                title="Total Users"
                value={data.users.totalUsers}
                subValue={`+${data.users.newUsersWeek} this week`}
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>}
                color="purple"
              />
              <StatCard
                title="Paid Subscribers"
                value={data.users.paidUsers}
                subValue={`${data.users.trialUsers} on trial`}
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>}
                color="green"
              />
              <StatCard
                title="Total Revenue"
                value={data.revenue.totalRevenue}
                subValue="USD"
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>}
                color="cyan"
                isCurrency
              />
              <StatCard
                title="Analyses Run"
                value={data.analysis.totalAnalyses}
                subValue={`${data.analysis.validSetups} valid`}
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18" /><path d="M18 9l-5-6-4 8-3-4" /></svg>}
                color="orange"
              />
            </div>

            {/* Revenue & Subscriptions */}
            <div className="two-column">
              <div className="card">
                <h3 className="card-title">Subscription Plans</h3>
                {data.subscriptionStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data.subscriptionStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="subscription_plan" stroke="rgba(255,255,255,0.4)" fontSize={12} />
                      <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                      <Tooltip contentStyle={{ background: 'rgba(15, 15, 25, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Subscribers" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="no-data">No subscription data yet</div>}
              </div>

              <div className="card">
                <h3 className="card-title">Revenue by Plan</h3>
                {data.subscriptionStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data.subscriptionStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="subscription_plan" stroke="rgba(255,255,255,0.4)" fontSize={12} />
                      <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickFormatter={(v) => `$${v}`} />
                      <Tooltip contentStyle={{ background: 'rgba(15, 15, 25, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Revenue']} />
                      <Bar dataKey="total_revenue" fill="#10b981" radius={[6, 6, 0, 0]} name="Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="no-data">No revenue data yet</div>}
              </div>
            </div>

            {/* Trading Stats */}
            <div className="stats-grid">
              <StatCard title="Buy Signals" value={data.analysis.buySignals} icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>} color="green" />
              <StatCard title="Sell Signals" value={data.analysis.sellSignals} icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7" /><polyline points="16 17 22 17 22 11" /></svg>} color="red" />
              <StatCard title="Valid Setups" value={data.analysis.validSetups} icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>} color="cyan" />
              <StatCard title="Avg Confidence" value={data.analysis.avgConfidence} subValue="%" icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>} color="purple" isPercent />
            </div>

            {/* Trading Pairs & Recent Users */}
            <div className="two-column">
              <div className="card">
                <h3 className="card-title">Popular Trading Pairs</h3>
                {data.popularPairs.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data.popularPairs.slice(0, 8)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis type="number" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                      <YAxis dataKey="pair" type="category" stroke="rgba(255,255,255,0.4)" fontSize={11} width={80} />
                      <Tooltip contentStyle={{ background: 'rgba(15, 15, 25, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                      <Bar dataKey="analyses" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="no-data">No trading data yet</div>}
              </div>

              <div className="card">
                <h3 className="card-title">Recent Registrations</h3>
                <div className="table-scroll">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Plan</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentUsers.length > 0 ? data.recentUsers.map((u, i) => (
                        <tr key={i}>
                          <td>{u.name}</td>
                          <td><span className={`badge ${u.payment_status === 'active' ? 'badge-green' : 'badge-orange'}`}>{u.subscription_plan || 'Free'}</span></td>
                          <td>{format(new Date(u.created_at), 'MMM d')}</td>
                        </tr>
                      )) : <tr><td colSpan={3} className="no-data-cell">No users yet</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Signal Distribution */}
            <div className="card">
              <h3 className="card-title">Signal Distribution</h3>
              <div className="signal-grid">
                <div className="signal-card signal-buy">
                  <div className="signal-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /></svg>
                  </div>
                  <div className="signal-value">{data.analysis.buySignals}</div>
                  <div className="signal-label">Buy Signals</div>
                </div>
                <div className="signal-card signal-sell">
                  <div className="signal-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7" /></svg>
                  </div>
                  <div className="signal-value">{data.analysis.sellSignals}</div>
                  <div className="signal-label">Sell Signals</div>
                </div>
                <div className="signal-card signal-hold">
                  <div className="signal-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
                  </div>
                  <div className="signal-value">{data.analysis.totalAnalyses - data.analysis.buySignals - data.analysis.sellSignals}</div>
                  <div className="signal-label">Hold Signals</div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ title, value, subValue, icon, color, isCurrency, isPercent, isText }: {
  title: string;
  value: number | string;
  subValue?: string;
  icon: React.ReactNode;
  color: 'purple' | 'cyan' | 'green' | 'orange' | 'red';
  isCurrency?: boolean;
  isPercent?: boolean;
  isText?: boolean;
}) {
  const displayValue = isText
    ? value
    : isCurrency
    ? `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : isPercent
    ? `${Number(value).toFixed(0)}%`
    : Number(value).toLocaleString();

  return (
    <div className={`stat-card stat-${color}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <p className="stat-title">{title}</p>
        <p className="stat-value">{displayValue}</p>
        {subValue && <p className="stat-subvalue">{subValue}</p>}
      </div>
    </div>
  );
}

const loginStyles = `
  .login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #0a0a12 0%, #12121f 50%, #0d0d18 100%);
    padding: 20px;
  }
  .login-card {
    width: 100%;
    max-width: 380px;
    padding: 48px 36px;
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(20px);
    text-align: center;
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
  }
  .login-logo {
    margin-bottom: 24px;
  }
  .logo-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto;
    background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }
  .logo-icon svg {
    width: 32px;
    height: 32px;
  }
  .login-title {
    margin: 0 0 8px;
    color: #fff;
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -0.5px;
  }
  .login-subtitle {
    margin: 0 0 32px;
    color: rgba(255, 255, 255, 0.4);
    font-size: 15px;
  }
  .login-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .login-input {
    padding: 16px 20px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
    font-size: 16px;
    outline: none;
    transition: all 0.2s;
  }
  .login-input:focus {
    border-color: #8b5cf6;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
  }
  .login-button {
    padding: 16px 24px;
    border-radius: 12px;
    border: none;
    background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
    color: #fff;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  .login-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
  }
  .login-error {
    color: #ef4444;
    font-size: 14px;
    margin: 0;
  }
`;

const loadingStyles = `
  .loading-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #0a0a12 0%, #12121f 50%, #0d0d18 100%);
    gap: 20px;
  }
  .loading-spinner {
    width: 48px;
    height: 48px;
    border: 3px solid rgba(139, 92, 246, 0.2);
    border-top-color: #8b5cf6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  .loading-text {
    color: rgba(255, 255, 255, 0.5);
    font-size: 15px;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const dashboardStyles = `
  .analytics-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #0a0a12 0%, #12121f 50%, #0d0d18 100%);
    color: #fff;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(12px);
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .header-title {
    margin: 0;
    font-size: 22px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 10px;
    letter-spacing: -0.5px;
  }
  .header-icon {
    color: #8b5cf6;
  }
  .live-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 20px;
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
    font-size: 13px;
    font-weight: 500;
  }
  .live-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #10b981;
    animation: pulse 2s infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  .header-right {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  .time-select {
    padding: 10px 16px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
    font-size: 14px;
    cursor: pointer;
    outline: none;
  }
  .refresh-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    border-radius: 10px;
    border: none;
    background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
    color: #fff;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  .refresh-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(139, 92, 246, 0.4);
  }
  .refresh-btn:disabled {
    opacity: 0.7;
  }
  .spin {
    animation: spin 1s linear infinite;
  }

  .section-tabs {
    display: flex;
    padding: 12px 24px;
    gap: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(0, 0, 0, 0.1);
  }
  .section-tab {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    border-radius: 10px;
    border: none;
    background: transparent;
    color: rgba(255, 255, 255, 0.5);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  .section-tab:hover {
    color: rgba(255, 255, 255, 0.8);
    background: rgba(255, 255, 255, 0.05);
  }
  .section-tab.active {
    background: rgba(139, 92, 246, 0.15);
    color: #fff;
  }

  .error-banner {
    margin: 16px 24px;
    padding: 14px 18px;
    border-radius: 12px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    color: #ef4444;
    font-size: 14px;
  }

  .main {
    padding: 24px;
    max-width: 1440px;
    margin: 0 auto;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }

  .stat-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 24px;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(255, 255, 255, 0.02);
    transition: all 0.2s;
  }
  .stat-card:hover {
    transform: translateY(-2px);
    border-color: rgba(255, 255, 255, 0.1);
  }
  .stat-purple { background: linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(99, 102, 241, 0.06) 100%); }
  .stat-cyan { background: linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(8, 145, 178, 0.06) 100%); }
  .stat-green { background: linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.06) 100%); }
  .stat-orange { background: linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.06) 100%); }
  .stat-red { background: linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(220, 38, 38, 0.06) 100%); }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .stat-icon svg {
    width: 24px;
    height: 24px;
  }
  .stat-purple .stat-icon { background: rgba(139, 92, 246, 0.2); color: #8b5cf6; }
  .stat-cyan .stat-icon { background: rgba(6, 182, 212, 0.2); color: #06b6d4; }
  .stat-green .stat-icon { background: rgba(16, 185, 129, 0.2); color: #10b981; }
  .stat-orange .stat-icon { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
  .stat-red .stat-icon { background: rgba(239, 68, 68, 0.2); color: #ef4444; }

  .stat-content { min-width: 0; }
  .stat-title {
    margin: 0;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.5);
    font-weight: 500;
  }
  .stat-value {
    margin: 4px 0 0;
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -1px;
  }
  .stat-subvalue {
    margin: 2px 0 0;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.4);
  }

  .card {
    padding: 24px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.06);
    margin-bottom: 20px;
  }
  .card-title {
    margin: 0 0 20px;
    font-size: 16px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .card-subtitle {
    font-size: 12px;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.5);
  }

  .two-column {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
    gap: 20px;
    margin-bottom: 20px;
  }
  .three-column {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
    margin-bottom: 20px;
  }

  .countries-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .country-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 0;
  }
  .country-info {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 120px;
  }
  .country-flag {
    font-size: 20px;
  }
  .country-name {
    font-size: 14px;
    font-weight: 500;
  }
  .country-stats {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    margin-left: 16px;
  }
  .country-bar {
    flex: 1;
    height: 6px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 3px;
    overflow: hidden;
  }
  .country-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #8b5cf6, #06b6d4);
    border-radius: 3px;
    transition: width 0.3s;
  }
  .country-value {
    font-size: 14px;
    font-weight: 600;
    min-width: 40px;
    text-align: right;
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
  }
  .data-table th {
    text-align: left;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.5);
    font-weight: 500;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .data-table td {
    padding: 12px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    font-size: 14px;
  }
  .table-scroll {
    overflow-x: auto;
  }
  .truncate {
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .nowrap {
    white-space: nowrap;
  }
  .no-data-cell {
    text-align: center;
    color: rgba(255, 255, 255, 0.3);
    padding: 32px !important;
  }

  .badge {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
  }
  .badge-purple { background: rgba(139, 92, 246, 0.2); color: #a78bfa; }
  .badge-cyan { background: rgba(6, 182, 212, 0.2); color: #22d3ee; }
  .badge-green { background: rgba(16, 185, 129, 0.2); color: #34d399; }
  .badge-orange { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }

  .no-data {
    height: 150px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.3);
    font-size: 14px;
  }

  .signal-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
  .signal-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 28px 20px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.06);
  }
  .signal-icon {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
  }
  .signal-icon svg {
    width: 28px;
    height: 28px;
  }
  .signal-buy .signal-icon { background: rgba(16, 185, 129, 0.15); color: #10b981; }
  .signal-sell .signal-icon { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
  .signal-hold .signal-icon { background: rgba(99, 102, 241, 0.15); color: #6366f1; }
  .signal-value {
    font-size: 32px;
    font-weight: 700;
    letter-spacing: -1px;
  }
  .signal-label {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.5);
    margin-top: 4px;
  }

  @media (max-width: 768px) {
    .header {
      flex-direction: column;
      gap: 16px;
      padding: 16px;
    }
    .header-right {
      width: 100%;
      justify-content: space-between;
    }
    .main {
      padding: 16px;
    }
    .stats-grid {
      grid-template-columns: 1fr 1fr;
    }
    .stat-card {
      padding: 16px;
    }
    .stat-value {
      font-size: 22px;
    }
    .two-column, .three-column {
      grid-template-columns: 1fr;
    }
    .signal-grid {
      grid-template-columns: 1fr;
    }
  }
`;
