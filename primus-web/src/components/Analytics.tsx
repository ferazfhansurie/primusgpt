import { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { format } from 'date-fns';

const ANALYTICS_PASSWORD = '!Demo123123';
const API_URL = import.meta.env.PROD
  ? '/api/analytics/data'
  : 'https://primusgpt-ai.vercel.app/api/analytics/data';

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];

// Country code to flag emoji mapping
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

const getFlag = (country: string) => countryFlags[country] || '🌍';

interface AnalyticsData {
  overview: {
    totalPageviews: number;
    totalVisitors: number;
    visitorsToday: number;
    pageviewsToday: number;
    visitorsWeek: number;
    pageviewsWeek: number;
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
  pageviewsByDay: Array<{ date: string; pageviews: number; visitors: number }>;
  topPages: Array<{ page_path: string; views: number; visitors: number }>;
  topReferrers: Array<{ source: string; visits: number; visitors: number }>;
  countries: Array<{ country: string; visits: number; visitors: number }>;
  devices: Array<{ device: string; visits: number; visitors: number }>;
  browsers: Array<{ browser: string; visits: number; visitors: number }>;
  operatingSystems: Array<{ os: string; visits: number; visitors: number }>;
  recentVisitors: Array<{
    visitor_id: string;
    page_path: string;
    country: string;
    city: string;
    device: string;
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
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <div style={styles.loginLogo}>📊</div>
          <h1 style={styles.loginTitle}>Analytics Dashboard</h1>
          <p style={styles.loginSubtitle}>Enter password to access</p>
          <form onSubmit={handleLogin} style={styles.loginForm}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              style={styles.loginInput}
              autoFocus
            />
            {error && <p style={styles.loginError}>{error}</p>}
            <button type="submit" style={styles.loginButton}>Access Dashboard</button>
          </form>
        </div>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner} />
        <p style={styles.loadingText}>Loading analytics...</p>
      </div>
    );
  }

  const totalVisitorsForPercent = data?.countries.reduce((sum, c) => sum + Number(c.visitors), 0) || 1;

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.headerTitle}>📊 PrimusGPT Analytics</h1>
          <span style={styles.headerBadge}>● Live</span>
        </div>
        <div style={styles.headerRight}>
          <select value={timeRange} onChange={(e) => setTimeRange(parseInt(e.target.value))} style={styles.timeSelect}>
            <option value={1}>Today</option>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button onClick={fetchData} style={styles.refreshButton} disabled={loading}>
            {loading ? '...' : '↻'} Refresh
          </button>
        </div>
      </header>

      {/* Section Tabs */}
      <nav style={styles.sectionTabs}>
        <button
          onClick={() => setActiveSection('site')}
          style={{ ...styles.sectionTab, ...(activeSection === 'site' ? styles.sectionTabActive : {}) }}
        >
          🌐 Site Tracking
        </button>
        <button
          onClick={() => setActiveSection('database')}
          style={{ ...styles.sectionTab, ...(activeSection === 'database' ? styles.sectionTabActive : {}) }}
        >
          🗄️ Database
        </button>
      </nav>

      {error && <div style={styles.errorBanner}>{error}</div>}

      <main style={styles.main}>
        {/* SITE TRACKING SECTION */}
        {activeSection === 'site' && data && (
          <>
            {/* Overview Stats */}
            <div style={styles.statsGrid}>
              <StatCard title="Total Visitors" value={data.overview.totalVisitors} subValue={`+${data.overview.visitorsToday} today`} icon="👥" gradient="purple" />
              <StatCard title="Page Views" value={data.overview.totalPageviews} subValue={`+${data.overview.pageviewsToday} today`} icon="👁️" gradient="cyan" />
              <StatCard title="This Week" value={data.overview.visitorsWeek} subValue="unique visitors" icon="📈" gradient="green" />
              <StatCard title="Bounce Rate" value={0} subValue="coming soon" icon="↩️" gradient="orange" />
            </div>

            {/* Traffic Chart */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Traffic Overview</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={data.pageviewsByDay.slice().reverse()}>
                  <defs>
                    <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPageviews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" tickFormatter={(val) => format(new Date(val), 'MMM d')} fontSize={12} />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} />
                  <Tooltip contentStyle={styles.tooltip} labelFormatter={(val) => format(new Date(val), 'MMMM d, yyyy')} />
                  <Legend />
                  <Area type="monotone" dataKey="visitors" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorVisitors)" name="Visitors" />
                  <Area type="monotone" dataKey="pageviews" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorPageviews)" name="Page Views" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Countries Section - PROMINENT */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>🌍 Countries</h3>
              <div style={styles.countriesGrid}>
                {data.countries.length > 0 ? data.countries.map((c, i) => (
                  <div key={i} style={styles.countryRow}>
                    <div style={styles.countryInfo}>
                      <span style={styles.countryFlag}>{getFlag(c.country)}</span>
                      <span style={styles.countryName}>{c.country}</span>
                    </div>
                    <div style={styles.countryStats}>
                      <div style={styles.countryBar}>
                        <div style={{ ...styles.countryBarFill, width: `${(Number(c.visitors) / totalVisitorsForPercent) * 100}%` }} />
                      </div>
                      <span style={styles.countryPercent}>{((Number(c.visitors) / totalVisitorsForPercent) * 100).toFixed(0)}%</span>
                      <span style={styles.countryVisitors}>{c.visitors}</span>
                    </div>
                  </div>
                )) : <div style={styles.noData}>No country data yet</div>}
              </div>
            </div>

            {/* Devices, Browsers, OS */}
            <div style={styles.threeColumn}>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>📱 Devices</h3>
                {data.devices.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={data.devices} dataKey="visitors" nameKey="device" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`} labelLine={false}>
                        {data.devices.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={styles.tooltip} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div style={styles.noData}>No data</div>}
              </div>

              <div style={styles.card}>
                <h3 style={styles.cardTitle}>🌐 Browsers</h3>
                {data.browsers.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={data.browsers} dataKey="visitors" nameKey="browser" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`} labelLine={false}>
                        {data.browsers.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={styles.tooltip} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div style={styles.noData}>No data</div>}
              </div>

              <div style={styles.card}>
                <h3 style={styles.cardTitle}>💻 Operating Systems</h3>
                {data.operatingSystems.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={data.operatingSystems} dataKey="visitors" nameKey="os" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`} labelLine={false}>
                        {data.operatingSystems.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={styles.tooltip} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div style={styles.noData}>No data</div>}
              </div>
            </div>

            {/* Pages & Referrers */}
            <div style={styles.twoColumn}>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>📄 Top Pages</h3>
                <table style={styles.table}>
                  <thead><tr><th style={styles.th}>Page</th><th style={{ ...styles.th, textAlign: 'right' }}>Views</th></tr></thead>
                  <tbody>
                    {data.topPages.length > 0 ? data.topPages.map((p, i) => (
                      <tr key={i}><td style={styles.td}>{p.page_path}</td><td style={{ ...styles.td, textAlign: 'right' }}>{p.views}</td></tr>
                    )) : <tr><td colSpan={2} style={{ ...styles.td, textAlign: 'center' }}>No data</td></tr>}
                  </tbody>
                </table>
              </div>

              <div style={styles.card}>
                <h3 style={styles.cardTitle}>🔗 Traffic Sources</h3>
                <table style={styles.table}>
                  <thead><tr><th style={styles.th}>Source</th><th style={{ ...styles.th, textAlign: 'right' }}>Visits</th></tr></thead>
                  <tbody>
                    {data.topReferrers.length > 0 ? data.topReferrers.map((r, i) => (
                      <tr key={i}><td style={styles.td}>{r.source}</td><td style={{ ...styles.td, textAlign: 'right' }}>{r.visits}</td></tr>
                    )) : <tr><td colSpan={2} style={{ ...styles.td, textAlign: 'center' }}>No data</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Visitors */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>👥 Recent Visitors</h3>
              <div style={styles.tableScroll}>
                <table style={styles.table}>
                  <thead><tr><th style={styles.th}>Time</th><th style={styles.th}>Page</th><th style={styles.th}>Location</th><th style={styles.th}>Device</th></tr></thead>
                  <tbody>
                    {data.recentVisitors.length > 0 ? data.recentVisitors.slice(0, 20).map((v, i) => (
                      <tr key={i}>
                        <td style={styles.td}>{format(new Date(v.created_at), 'MMM d, HH:mm')}</td>
                        <td style={styles.td}>{v.page_path}</td>
                        <td style={styles.td}>{getFlag(v.country)} {v.city !== 'unknown' ? `${v.city}, ${v.country}` : v.country}</td>
                        <td style={styles.td}><span style={{ ...styles.badge, background: v.device === 'Mobile' ? 'rgba(139,92,246,0.2)' : 'rgba(6,182,212,0.2)', color: v.device === 'Mobile' ? '#8b5cf6' : '#06b6d4' }}>{v.device}</span></td>
                      </tr>
                    )) : <tr><td colSpan={4} style={{ ...styles.td, textAlign: 'center' }}>No visitors yet</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* DATABASE SECTION */}
        {activeSection === 'database' && data && (
          <>
            {/* User Stats */}
            <div style={styles.statsGrid}>
              <StatCard title="Total Users" value={data.users.totalUsers} subValue={`+${data.users.newUsersWeek} this week`} icon="👥" gradient="purple" />
              <StatCard title="Paid Subscribers" value={data.users.paidUsers} subValue={`${data.users.trialUsers} on trial`} icon="💎" gradient="green" />
              <StatCard title="Total Revenue" value={data.revenue.totalRevenue} subValue="USD" icon="💰" gradient="cyan" isCurrency />
              <StatCard title="Analyses Run" value={data.analysis.totalAnalyses} subValue={`${data.analysis.validSetups} valid`} icon="📊" gradient="orange" />
            </div>

            {/* Revenue & Subscriptions */}
            <div style={styles.twoColumn}>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>📊 Subscription Plans</h3>
                {data.subscriptionStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data.subscriptionStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="subscription_plan" stroke="rgba(255,255,255,0.4)" fontSize={12} />
                      <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} />
                      <Tooltip contentStyle={styles.tooltip} />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Subscribers" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div style={styles.noData}>No subscription data yet</div>}
              </div>

              <div style={styles.card}>
                <h3 style={styles.cardTitle}>💰 Revenue by Plan</h3>
                {data.subscriptionStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data.subscriptionStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="subscription_plan" stroke="rgba(255,255,255,0.4)" fontSize={12} />
                      <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickFormatter={(v) => `$${v}`} />
                      <Tooltip contentStyle={styles.tooltip} formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Revenue']} />
                      <Bar dataKey="total_revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div style={styles.noData}>No revenue data yet</div>}
              </div>
            </div>

            {/* Trading Stats */}
            <div style={styles.statsGrid}>
              <StatCard title="Buy Signals" value={data.analysis.buySignals} icon="📈" gradient="green" />
              <StatCard title="Sell Signals" value={data.analysis.sellSignals} icon="📉" gradient="red" />
              <StatCard title="Valid Setups" value={data.analysis.validSetups} icon="✅" gradient="cyan" />
              <StatCard title="Avg Confidence" value={data.analysis.avgConfidence} subValue="%" icon="🎯" gradient="purple" isPercent />
            </div>

            {/* Trading Pairs & Recent Users */}
            <div style={styles.twoColumn}>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>📈 Popular Trading Pairs</h3>
                {data.popularPairs.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data.popularPairs.slice(0, 8)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis type="number" stroke="rgba(255,255,255,0.4)" fontSize={12} />
                      <YAxis dataKey="pair" type="category" stroke="rgba(255,255,255,0.4)" fontSize={12} width={80} />
                      <Tooltip contentStyle={styles.tooltip} />
                      <Bar dataKey="analyses" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div style={styles.noData}>No trading data yet</div>}
              </div>

              <div style={styles.card}>
                <h3 style={styles.cardTitle}>🆕 Recent Registrations</h3>
                <div style={styles.tableScroll}>
                  <table style={styles.table}>
                    <thead><tr><th style={styles.th}>User</th><th style={styles.th}>Plan</th><th style={styles.th}>Date</th></tr></thead>
                    <tbody>
                      {data.recentUsers.length > 0 ? data.recentUsers.map((u, i) => (
                        <tr key={i}>
                          <td style={styles.td}>{u.name}</td>
                          <td style={styles.td}><span style={{ ...styles.badge, background: u.payment_status === 'active' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)', color: u.payment_status === 'active' ? '#10b981' : '#f59e0b' }}>{u.subscription_plan || 'Free'}</span></td>
                          <td style={styles.td}>{format(new Date(u.created_at), 'MMM d')}</td>
                        </tr>
                      )) : <tr><td colSpan={3} style={{ ...styles.td, textAlign: 'center' }}>No users yet</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Signal Distribution */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>📊 Signal Distribution</h3>
              <div style={styles.signalGrid}>
                <div style={styles.signalCard}>
                  <div style={{ ...styles.signalIcon, background: 'rgba(16,185,129,0.2)', color: '#10b981' }}>📈</div>
                  <div style={styles.signalValue}>{data.analysis.buySignals}</div>
                  <div style={styles.signalLabel}>Buy Signals</div>
                </div>
                <div style={styles.signalCard}>
                  <div style={{ ...styles.signalIcon, background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>📉</div>
                  <div style={styles.signalValue}>{data.analysis.sellSignals}</div>
                  <div style={styles.signalLabel}>Sell Signals</div>
                </div>
                <div style={styles.signalCard}>
                  <div style={{ ...styles.signalIcon, background: 'rgba(99,102,241,0.2)', color: '#6366f1' }}>⏸️</div>
                  <div style={styles.signalValue}>{data.analysis.totalAnalyses - data.analysis.buySignals - data.analysis.sellSignals}</div>
                  <div style={styles.signalLabel}>Hold Signals</div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ title, value, subValue, icon, gradient, isCurrency, isPercent }: {
  title: string;
  value: number;
  subValue?: string;
  icon: string;
  gradient: 'purple' | 'cyan' | 'green' | 'orange' | 'red';
  isCurrency?: boolean;
  isPercent?: boolean;
}) {
  const gradients = {
    purple: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(99,102,241,0.1))',
    cyan: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(8,145,178,0.1))',
    green: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.1))',
    orange: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(217,119,6,0.1))',
    red: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(220,38,38,0.1))',
  };

  const displayValue = isCurrency
    ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : isPercent
    ? `${value.toFixed(1)}%`
    : value.toLocaleString();

  return (
    <div style={{ ...styles.statCard, background: gradients[gradient] }}>
      <div style={styles.statIcon}>{icon}</div>
      <div>
        <p style={styles.statTitle}>{title}</p>
        <p style={styles.statValue}>{displayValue}</p>
        {subValue && <p style={styles.statSubValue}>{subValue}</p>}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: { minHeight: '100vh', background: 'linear-gradient(180deg, #0a0a0f 0%, #111118 100%)', color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 100 },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  headerTitle: { margin: 0, fontSize: '20px', fontWeight: '600' },
  headerBadge: { padding: '4px 10px', borderRadius: '20px', background: 'rgba(16,185,129,0.2)', color: '#10b981', fontSize: '12px', fontWeight: '500' },
  headerRight: { display: 'flex', gap: '10px', alignItems: 'center' },
  timeSelect: { padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '13px', cursor: 'pointer' },
  refreshButton: { padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: '#fff', fontSize: '13px', fontWeight: '500', cursor: 'pointer' },
  sectionTabs: { display: 'flex', padding: '12px 24px', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)' },
  sectionTab: { padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' },
  sectionTabActive: { background: 'rgba(139,92,246,0.2)', color: '#fff' },
  errorBanner: { margin: '16px 24px', padding: '12px 16px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: '14px' },
  main: { padding: '20px 24px', maxWidth: '1400px', margin: '0 auto' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' },
  statCard: { display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' },
  statIcon: { fontSize: '28px' },
  statTitle: { margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  statValue: { margin: '4px 0 0 0', fontSize: '24px', fontWeight: '700' },
  statSubValue: { margin: '2px 0 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.4)' },
  card: { padding: '20px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '16px' },
  cardTitle: { margin: '0 0 16px 0', fontSize: '15px', fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  tooltip: { background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' },
  twoColumn: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '16px', marginBottom: '16px' },
  threeColumn: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontWeight: '500', fontSize: '12px', textTransform: 'uppercase' },
  td: { padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '13px' },
  tableScroll: { overflowX: 'auto' },
  badge: { padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '500' },
  noData: { height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px' },
  countriesGrid: { display: 'flex', flexDirection: 'column', gap: '8px' },
  countryRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' },
  countryInfo: { display: 'flex', alignItems: 'center', gap: '10px', minWidth: '100px' },
  countryFlag: { fontSize: '20px' },
  countryName: { fontSize: '13px', fontWeight: '500' },
  countryStats: { display: 'flex', alignItems: 'center', gap: '12px', flex: 1, marginLeft: '20px' },
  countryBar: { flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' },
  countryBarFill: { height: '100%', background: 'linear-gradient(90deg, #8b5cf6, #06b6d4)', borderRadius: '3px', transition: 'width 0.3s' },
  countryPercent: { fontSize: '13px', fontWeight: '600', minWidth: '40px', textAlign: 'right' },
  countryVisitors: { fontSize: '12px', color: 'rgba(255,255,255,0.4)', minWidth: '30px', textAlign: 'right' },
  signalGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' },
  signalCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' },
  signalIcon: { width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '12px' },
  signalValue: { fontSize: '28px', fontWeight: '700' },
  signalLabel: { fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' },
  loginContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg, #0a0a0f 0%, #111118 100%)', padding: '20px' },
  loginCard: { width: '100%', maxWidth: '360px', padding: '40px 32px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' },
  loginLogo: { fontSize: '48px', marginBottom: '16px' },
  loginTitle: { margin: '0 0 8px 0', color: '#fff', fontSize: '24px', fontWeight: '600' },
  loginSubtitle: { margin: '0 0 24px 0', color: 'rgba(255,255,255,0.4)', fontSize: '14px' },
  loginForm: { display: 'flex', flexDirection: 'column', gap: '12px' },
  loginInput: { padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '15px', outline: 'none' },
  loginButton: { padding: '12px 20px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: '#fff', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  loginError: { color: '#ef4444', fontSize: '13px', margin: 0 },
  loadingContainer: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg, #0a0a0f 0%, #111118 100%)', gap: '16px' },
  loadingSpinner: { width: '40px', height: '40px', border: '3px solid rgba(139,92,246,0.2)', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  loadingText: { color: 'rgba(255,255,255,0.5)', fontSize: '14px' },
};

// Add keyframes
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}
