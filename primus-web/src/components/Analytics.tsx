import { useState, useEffect } from 'react';
import { getAnalyticsSummary, clearAnalytics } from '../utils/analytics';

const ANALYTICS_PASSWORD = '!Demo123123';

export default function Analytics() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<ReturnType<typeof getAnalyticsSummary> | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('analytics_auth');
    if (stored === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      setSummary(getAnalyticsSummary());
    }
  }, [isAuthenticated]);

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

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all analytics data?')) {
      clearAnalytics();
      setSummary(getAnalyticsSummary());
    }
  };

  const handleRefresh = () => {
    setSummary(getAnalyticsSummary());
  };

  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      }}>
        <form onSubmit={handleLogin} style={{
          background: 'rgba(255,255,255,0.05)',
          padding: '40px',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.1)',
          width: '100%',
          maxWidth: '400px',
        }}>
          <h1 style={{ color: '#fff', marginBottom: '24px', textAlign: 'center' }}>Analytics Dashboard</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              fontSize: '16px',
              marginBottom: '16px',
              boxSizing: 'border-box',
            }}
          />
          {error && <p style={{ color: '#ff6b6b', marginBottom: '16px', textAlign: 'center' }}>{error}</p>}
          <button type="submit" style={{
            width: '100%',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
          }}>
            Access Dashboard
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      padding: '40px 20px',
      color: '#fff',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h1 style={{ margin: 0 }}>Analytics Dashboard</h1>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleRefresh} style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'transparent',
              color: '#fff',
              cursor: 'pointer',
            }}>
              Refresh
            </button>
            <button onClick={handleClearData} style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #ff6b6b',
              background: 'transparent',
              color: '#ff6b6b',
              cursor: 'pointer',
            }}>
              Clear Data
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '40px',
        }}>
          <StatCard title="Visitors Today" value={summary?.visitors.today || 0} />
          <StatCard title="Visitors (7 days)" value={summary?.visitors.week || 0} />
          <StatCard title="Page Views Today" value={summary?.pageViews.today || 0} />
          <StatCard title="Page Views (7 days)" value={summary?.pageViews.week || 0} />
          <StatCard title="Total Visitors" value={summary?.totalVisitors || 0} />
          <StatCard title="Total Page Views" value={summary?.totalPageViews || 0} />
        </div>

        {/* Tables */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <h3 style={{ marginTop: 0 }}>Top Pages (7 days)</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Page</th>
                  <th style={{ textAlign: 'right', padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Views</th>
                </tr>
              </thead>
              <tbody>
                {summary?.topPages.length ? summary.topPages.map(([page, views]) => (
                  <tr key={page}>
                    <td style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{page}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'right' }}>{views}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={2} style={{ padding: '12px', textAlign: 'center', opacity: 0.5 }}>No data yet</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <h3 style={{ marginTop: 0 }}>Top Referrers (7 days)</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Referrer</th>
                  <th style={{ textAlign: 'right', padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Views</th>
                </tr>
              </thead>
              <tbody>
                {summary?.topReferrers.length ? summary.topReferrers.map(([referrer, views]) => (
                  <tr key={referrer}>
                    <td style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', wordBreak: 'break-all' }}>
                      {referrer === 'direct' ? 'Direct' : referrer}
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'right' }}>{views}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={2} style={{ padding: '12px', textAlign: 'center', opacity: 0.5 }}>No data yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p style={{ marginTop: '40px', textAlign: 'center', opacity: 0.5, fontSize: '14px' }}>
          Note: Analytics data is stored locally in the browser. Each visitor sees their own data only.
        </p>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid rgba(255,255,255,0.1)',
    }}>
      <p style={{ margin: '0 0 8px 0', opacity: 0.7, fontSize: '14px' }}>{title}</p>
      <p style={{ margin: 0, fontSize: '32px', fontWeight: '700' }}>{value.toLocaleString()}</p>
    </div>
  );
}
