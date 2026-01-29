import React, { useState, useEffect, useRef } from 'react';
import './TradingAnalysis.css';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

interface SubscriptionStatus {
  type: 'trial' | 'subscription' | 'expired';
  daysLeft?: number;
  endDate?: string;
  plan?: string;
  expiringSoon?: boolean;
  message?: string;
}

interface Zone {
  price_low: number;
  price_high: number;
}

interface ChartImage {
  timeframe: string;
  image: string;
}

interface AnalysisResult {
  pair: string;
  strategy: string;
  signal: 'buy' | 'sell' | 'wait';
  confidence: number;
  valid: boolean;
  trend: string;
  zone?: Zone;
  stopLoss?: number;
  takeProfit1?: number;
  takeProfit2?: number;
  charts: ChartImage[];
  timeframes: string[];
  reasoning: string;
  validation?: {
    daily?: { errors?: string[]; warnings?: string[] };
    m30?: { errors?: string[]; warnings?: string[] };
  };
  timestamp: string;
}

type Step = 'login' | 'market' | 'pair' | 'strategy' | 'analyzing' | 'result';

const FOREX_PAIRS = [
  { symbol: 'EUR/USD', code1: 'EUR', code2: 'USD', name: 'Euro / US Dollar' },
  { symbol: 'GBP/USD', code1: 'GBP', code2: 'USD', name: 'British Pound / US Dollar' },
  { symbol: 'USD/JPY', code1: 'USD', code2: 'JPY', name: 'US Dollar / Japanese Yen' },
  { symbol: 'AUD/USD', code1: 'AUD', code2: 'USD', name: 'Australian Dollar / US Dollar' },
  { symbol: 'USD/CAD', code1: 'USD', code2: 'CAD', name: 'US Dollar / Canadian Dollar' },
  { symbol: 'NZD/USD', code1: 'NZD', code2: 'USD', name: 'New Zealand Dollar / US Dollar' },
];

const TradingAnalysis: React.FC = () => {
  const [step, setStep] = useState<Step>('login');
  const [user, setUser] = useState<User | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Selection states
  const [market, setMarket] = useState<'forex' | 'gold' | null>(null);
  const [pair, setPair] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<string | null>(null);

  // Analysis states
  const [analysisPhase, setAnalysisPhase] = useState<'connecting' | 'fetching' | 'analyzing' | 'validating' | 'complete'>('connecting');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState('');

  const cardRef = useRef<HTMLDivElement>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Check for existing session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('primus_web_token');
    if (savedToken) {
      validateSession(savedToken);
    }
  }, []);

  const transitionTo = (newStep: Step) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setStep(newStep);
      setIsTransitioning(false);
    }, 300);
  };

  const validateSession = async (savedToken: string) => {
    try {
      const response = await fetch(`${API_URL}/api/web-auth/validate`, {
        headers: {
          'Authorization': `Bearer ${savedToken}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setToken(savedToken);
        setUser(data.user);
        setSubscriptionStatus(data.subscriptionStatus);
        setStep('market');
      } else {
        localStorage.removeItem('primus_web_token');
      }
    } catch (error) {
      console.error('Session validation failed:', error);
      localStorage.removeItem('primus_web_token');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/web-auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, phone })
      });

      const data = await response.json();

      if (data.success) {
        setToken(data.token);
        setUser(data.user);
        setSubscriptionStatus(data.subscriptionStatus);
        localStorage.setItem('primus_web_token', data.token);
        transitionTo('market');
      } else {
        if (data.needsRenewal) {
          setLoginError('Your subscription has expired. Please renew to continue.');
        } else {
          setLoginError(data.error || 'Login failed');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Network error. Please check your connection.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/web-auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    }

    setToken(null);
    setUser(null);
    setSubscriptionStatus(null);
    localStorage.removeItem('primus_web_token');
    resetFlow();
    transitionTo('login');
  };

  const handleMarketSelect = (selectedMarket: 'forex' | 'gold') => {
    setMarket(selectedMarket);
    if (selectedMarket === 'gold') {
      setPair('XAU/USD');
      transitionTo('strategy');
    } else {
      transitionTo('pair');
    }
  };

  const handlePairSelect = (selectedPair: string) => {
    setPair(selectedPair);
    transitionTo('strategy');
  };

  const handleStrategySelect = async (selectedStrategy: string) => {
    setStrategy(selectedStrategy);
    transitionTo('analyzing');
    setAnalysisPhase('connecting');
    setAnalysisError('');

    // Simulate phase transitions based on typical API timing
    const phaseTimings = [
      { phase: 'fetching', delay: 1500 },
      { phase: 'analyzing', delay: 4000 },
      { phase: 'validating', delay: 8000 },
    ];

    phaseTimings.forEach(({ phase, delay }) => {
      setTimeout(() => {
        setAnalysisPhase(phase as any);
      }, delay);
    });

    try {
      const response = await fetch(`${API_URL}/api/analysis/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          pair,
          strategy: selectedStrategy,
          market
        })
      });

      const data = await response.json();

      if (data.success) {
        setAnalysisPhase('complete');
        setAnalysisResult(data.analysis);
        setTimeout(() => transitionTo('result'), 600);
      } else {
        if (data.needsRenewal) {
          setAnalysisError('Your subscription has expired. Please renew to continue.');
        } else {
          setAnalysisError(data.error || 'Analysis failed');
        }
        transitionTo('result');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisError('Network error. Please try again.');
      transitionTo('result');
    }
  };

  const resetFlow = () => {
    setMarket(null);
    setPair(null);
    setStrategy(null);
    setAnalysisResult(null);
    setAnalysisError('');
    setAnalysisPhase('connecting');
  };

  const handleBackToMenu = () => {
    resetFlow();
    transitionTo('market');
  };

  const handleRetry = () => {
    if (pair && strategy) {
      handleStrategySelect(strategy);
    }
  };

  const formatPrice = (price: number) => {
    if (pair?.includes('JPY')) {
      return price.toFixed(3);
    }
    if (pair === 'XAU/USD') {
      return price.toFixed(2);
    }
    return price.toFixed(5);
  };

  const renderSubscriptionBadge = () => {
    if (!subscriptionStatus) return null;

    const { type, daysLeft, plan, expiringSoon } = subscriptionStatus;

    return (
      <div className={`ta-subscription-pill ${type} ${expiringSoon ? 'expiring' : ''}`}>
        <div className="ta-pill-glow"></div>
        <span className="ta-pill-icon">
          {type === 'trial' ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
            </svg>
          ) : expiringSoon ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><path d="M12 6V12L16 14"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17L4 12"/>
            </svg>
          )}
        </span>
        <span className="ta-pill-text">
          {type === 'trial' ? 'Free Trial' : plan} - {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
        </span>
      </div>
    );
  };

  const renderLogin = () => (
    <div className="ta-card ta-login-card">
      <div className="ta-card-glow"></div>

      <div className="ta-login-header">
        <h1 className="ta-login-title">Welcome Back</h1>
        <p className="ta-login-subtitle">Access your trading analysis dashboard</p>
      </div>

      <form onSubmit={handleLogin} className="ta-form">
        <div className="ta-input-group">
          <label className="ta-input-label">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="ta-input ta-input-modern"
          />
        </div>

        <div className="ta-input-group">
          <label className="ta-input-label">Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 234 567 8900"
            required
            className="ta-input ta-input-modern"
          />
        </div>

        {loginError && (
          <div className="ta-error-modern">
            <svg viewBox="0 0 20 20" fill="currentColor" className="ta-error-icon-modern">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
            </svg>
            <span>{loginError}</span>
          </div>
        )}

        <button type="submit" className="ta-btn ta-btn-modern" disabled={loginLoading}>
          {loginLoading ? (
            <>
              <span className="ta-spinner-modern"></span>
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <span>Continue</span>
              <svg viewBox="0 0 20 20" fill="currentColor" className="ta-btn-icon-modern">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </>
          )}
        </button>
      </form>

      <div className="ta-divider-modern">
        <span>Don't have an account?</span>
      </div>

      <a href="/register" className="ta-link-modern">
        Create account
      </a>
    </div>
  );

  const renderMarketSelection = () => (
    <div className="ta-card">
      <div className="ta-card-glow"></div>

      <div className="ta-header">
        <div className="ta-header-content">
          <h2 className="ta-title">Choose Your Market</h2>
          <p className="ta-subtitle">Select the market you want to analyze</p>
        </div>
        {renderSubscriptionBadge()}
      </div>

      <div className="ta-market-grid">
        <button
          className="ta-market-card forex"
          onClick={() => handleMarketSelect('forex')}
        >
          <div className="ta-market-bg"></div>
          <div className="ta-market-content">
            <div className="ta-market-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="ta-market-svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                <path d="M2 12h20M12 2c2.21 3.19 3.5 6.48 3.5 10s-1.29 6.81-3.5 10c-2.21-3.19-3.5-6.48-3.5-10s1.29-6.81 3.5-10z"/>
              </svg>
              <div className="ta-market-ring"></div>
            </div>
            <h3 className="ta-market-title">Forex</h3>
            <p className="ta-market-desc">Major currency pairs</p>
            <div className="ta-market-pairs">
              <span>EUR/USD</span>
              <span>GBP/USD</span>
              <span>+4 more</span>
            </div>
          </div>
          <div className="ta-market-arrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12H19M19 12L12 5M19 12L12 19"/>
            </svg>
          </div>
        </button>

        <button
          className="ta-market-card gold"
          onClick={() => handleMarketSelect('gold')}
        >
          <div className="ta-market-bg"></div>
          <div className="ta-market-content">
            <div className="ta-market-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="ta-market-svg gold">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
              </svg>
              <div className="ta-market-ring gold"></div>
            </div>
            <h3 className="ta-market-title">Gold</h3>
            <p className="ta-market-desc">Precious metals trading</p>
            <div className="ta-market-pairs gold">
              <span>XAU/USD</span>
            </div>
          </div>
          <div className="ta-market-arrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12H19M19 12L12 5M19 12L12 19"/>
            </svg>
          </div>
        </button>
      </div>

      <button className="ta-btn ta-btn-text" onClick={handleLogout}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ta-logout-icon">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
        </svg>
        Logout
      </button>
    </div>
  );

  const renderPairSelection = () => (
    <div className="ta-card">
      <div className="ta-card-glow"></div>

      <div className="ta-header">
        <button className="ta-back-btn" onClick={() => transitionTo('market')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M5 12L12 19M5 12L12 5"/>
          </svg>
        </button>
        <div className="ta-header-content">
          <h2 className="ta-title">Select Currency Pair</h2>
          <p className="ta-subtitle">Choose the pair you want to analyze</p>
        </div>
      </div>

      <div className="ta-pairs-grid">
        {FOREX_PAIRS.map((p, index) => (
          <button
            key={p.symbol}
            className="ta-pair-card"
            onClick={() => handlePairSelect(p.symbol)}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="ta-pair-codes">
              <span className="ta-code">{p.code1}</span>
              <span className="ta-code-divider">/</span>
              <span className="ta-code">{p.code2}</span>
            </div>
            <div className="ta-pair-info">
              <span className="ta-pair-symbol">{p.symbol}</span>
              <span className="ta-pair-name">{p.name}</span>
            </div>
            <div className="ta-pair-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12H19M19 12L12 5M19 12L12 19"/>
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStrategySelection = () => (
    <div className="ta-card">
      <div className="ta-card-glow"></div>

      <div className="ta-header">
        <button className="ta-back-btn" onClick={() => transitionTo(market === 'gold' ? 'market' : 'pair')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M5 12L12 19M5 12L12 5"/>
          </svg>
        </button>
        <div className="ta-header-content">
          <h2 className="ta-title">Select Strategy</h2>
          <div className="ta-selected-pair">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ta-selected-icon">
              <path d="M3 3V21H21"/><path d="M7 14L11 10L15 14L21 8"/>
            </svg>
            <span>{pair}</span>
          </div>
        </div>
      </div>

      <div className="ta-strategy-grid">
        <button
          className="ta-strategy-card swing"
          onClick={() => handleStrategySelect('swing')}
        >
          <div className="ta-strategy-visual">
            <div className="ta-wave-container">
              <svg viewBox="0 0 100 40" className="ta-wave">
                <path d="M0,20 Q25,5 50,20 T100,20" fill="none" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
          </div>
          <div className="ta-strategy-content">
            <h3 className="ta-strategy-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ta-strategy-icon">
                <path d="M3 17L9 11L13 15L21 7"/><path d="M17 7H21V11"/>
              </svg>
              Swing Trading
            </h3>
            <p className="ta-strategy-desc">Daily + 30min analysis for medium-term positions</p>
            <div className="ta-strategy-meta">
              <span className="ta-meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ta-meta-icon">
                  <circle cx="12" cy="12" r="10"/><path d="M12 6V12L16 14"/>
                </svg>
                Hold: 1-14 days
              </span>
              <span className="ta-meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ta-meta-icon">
                  <path d="M3 3V21H21"/><path d="M7 14L11 10L15 14L21 8"/>
                </svg>
                D1 + M30
              </span>
            </div>
          </div>
        </button>

        <button
          className="ta-strategy-card scalping"
          onClick={() => handleStrategySelect('scalping')}
        >
          <div className="ta-strategy-visual">
            <div className="ta-pulse-container">
              <div className="ta-pulse-dot"></div>
              <div className="ta-pulse-ring"></div>
              <div className="ta-pulse-ring delay"></div>
            </div>
          </div>
          <div className="ta-strategy-content">
            <h3 className="ta-strategy-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ta-strategy-icon">
                <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z"/>
              </svg>
              Scalping
            </h3>
            <p className="ta-strategy-desc">15min + 5min analysis for quick trades</p>
            <div className="ta-strategy-meta">
              <span className="ta-meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ta-meta-icon">
                  <circle cx="12" cy="12" r="10"/><path d="M12 6V12L16 14"/>
                </svg>
                Hold: 5-60 mins
              </span>
              <span className="ta-meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ta-meta-icon">
                  <path d="M3 3V21H21"/><path d="M7 14L11 10L15 14L21 8"/>
                </svg>
                M15 + M5
              </span>
            </div>
          </div>
        </button>
      </div>
    </div>
  );

  const renderAnalyzing = () => {
    const phases = [
      { key: 'connecting', label: 'Connecting', icon: 'M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z M12 6V12L16 14' },
      { key: 'fetching', label: 'Fetching Data', icon: 'M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15 M7 10L12 15L17 10 M12 15V3' },
      { key: 'analyzing', label: 'AI Analysis', icon: 'M12 2L2 7L12 12L22 7L12 2Z M2 17L12 22L22 17 M2 12L12 17L22 12' },
      { key: 'validating', label: 'Validating', icon: 'M9 11L12 14L22 4 M21 12V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16' },
      { key: 'complete', label: 'Complete', icon: 'M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999 M22 4L12 14.01L9 11.01' },
    ];

    const currentIndex = phases.findIndex(p => p.key === analysisPhase);

    return (
      <div className="ta-card ta-analyzing-card">
        <div className="ta-card-glow analyzing"></div>

        <div className="ta-analyzing-visual">
          <div className="ta-orbit-container">
            <div className="ta-orbit-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="ta-orbit-svg">
                <path d="M3 3V21H21"/><path d="M7 14L11 10L15 14L21 8"/>
              </svg>
            </div>
            <div className="ta-orbit ring-1">
              <div className="ta-orbit-dot"></div>
            </div>
            <div className="ta-orbit ring-2">
              <div className="ta-orbit-dot"></div>
            </div>
            <div className="ta-orbit ring-3">
              <div className="ta-orbit-dot"></div>
            </div>
          </div>
        </div>

        <div className="ta-analyzing-info">
          <h2 className="ta-analyzing-title">Analyzing {pair}</h2>
          <p className="ta-analyzing-strategy">{strategy?.toUpperCase()} Strategy</p>
        </div>

        <div className="ta-analyzing-steps">
          {phases.map((phase, index) => (
            <div
              key={phase.key}
              className={`ta-step ${index < currentIndex ? 'done' : index === currentIndex ? 'active' : ''}`}
            >
              <div className="ta-step-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d={phase.icon}/>
                </svg>
              </div>
              <span className="ta-step-label">{phase.label}</span>
            </div>
          ))}
        </div>

        <div className="ta-analyzing-status">
          {analysisPhase === 'connecting' && 'Connecting to market data...'}
          {analysisPhase === 'fetching' && 'Fetching price history...'}
          {analysisPhase === 'analyzing' && 'Running AI analysis...'}
          {analysisPhase === 'validating' && 'Validating trading setup...'}
          {analysisPhase === 'complete' && 'Analysis complete!'}
        </div>
      </div>
    );
  };

  const renderResult = () => {
    if (analysisError) {
      return (
        <div className="ta-card ta-error-card">
          <div className="ta-card-glow error"></div>

          <div className="ta-error-visual">
            <div className="ta-error-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ta-error-big-icon">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8V12M12 16H12.01"/>
              </svg>
            </div>
          </div>

          <h2 className="ta-error-title">Analysis Failed</h2>
          <p className="ta-error-message">{analysisError}</p>

          <div className="ta-action-buttons">
            <button className="ta-btn ta-btn-primary" onClick={handleRetry}>
              <span className="ta-btn-bg"></span>
              <span className="ta-btn-content">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ta-btn-icon">
                  <path d="M1 4V10H7M23 20V14H17"/>
                  <path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14L18.36 18.36A9 9 0 013.51 15"/>
                </svg>
                Try Again
              </span>
            </button>
            <button className="ta-btn ta-btn-secondary" onClick={handleBackToMenu}>
              <span className="ta-btn-content">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ta-btn-icon">
                  <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"/>
                  <path d="M9 22V12H15V22"/>
                </svg>
                Back to Menu
              </span>
            </button>
          </div>
        </div>
      );
    }

    if (!analysisResult) {
      return null;
    }

    const { signal, confidence, valid, zone, stopLoss, takeProfit1, takeProfit2, charts, reasoning, validation } = analysisResult;
    const confidencePercent = (confidence * 100).toFixed(0);

    return (
      <div className={`ta-card ta-result-card ${signal}`}>
        <div className={`ta-card-glow ${signal}`}></div>

        {/* Header */}
        <div className="ta-result-header">
          <div className="ta-result-pair">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="ta-result-market-icon">
              {market === 'gold' ? (
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
              ) : (
                <><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M2 12h20M12 2c2.21 3.19 3.5 6.48 3.5 10s-1.29 6.81-3.5 10c-2.21-3.19-3.5-6.48-3.5-10s1.29-6.81 3.5-10z"/></>
              )}
            </svg>
            <div>
              <h2 className="ta-result-pair-name">{pair}</h2>
              <span className="ta-result-strategy">{strategy?.toUpperCase()}</span>
            </div>
          </div>
          <div className={`ta-validity-badge ${valid ? 'valid' : 'invalid'}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ta-validity-icon">
              {valid ? <path d="M20 6L9 17L4 12"/> : <path d="M18 6L6 18M6 6L18 18"/>}
            </svg>
            <span>{valid ? 'VALID SETUP' : 'INVALID'}</span>
          </div>
        </div>

        {/* Main Signal */}
        <div className={`ta-signal-hero ${signal}`}>
          <div className="ta-signal-bg"></div>
          <div className="ta-signal-content">
            <div className={`ta-signal-indicator ${signal}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="ta-signal-arrow">
                {signal === 'buy' ? (
                  <path d="M7 17L17 7M17 7H7M17 7V17"/>
                ) : signal === 'sell' ? (
                  <path d="M17 7L7 17M7 17H17M7 17V7"/>
                ) : (
                  <path d="M5 12H19"/>
                )}
              </svg>
            </div>
            <div className="ta-signal-text">
              <span className="ta-signal-label">Signal</span>
              <span className={`ta-signal-value ${signal}`}>{signal.toUpperCase()}</span>
            </div>
            <div className="ta-confidence-ring">
              <svg viewBox="0 0 36 36" className="ta-confidence-svg">
                <path
                  className="ta-confidence-bg"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={`ta-confidence-fill ${signal}`}
                  strokeDasharray={`${confidencePercent}, 100`}
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="ta-confidence-text">
                <span className="ta-confidence-value">{confidencePercent}</span>
                <span className="ta-confidence-percent">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Zone */}
        {zone && zone.price_low && zone.price_high && (
          <div className={`ta-zone-display ${signal}`}>
            <div className="ta-zone-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ta-zone-icon">
                {signal === 'sell' ? (
                  <path d="M3 17L9 11L13 15L21 7M21 7V13M21 7H15"/>
                ) : (
                  <path d="M3 7L9 13L13 9L21 17M21 17V11M21 17H15"/>
                )}
              </svg>
              <span className="ta-zone-title">{signal === 'sell' ? 'Sell Zone' : 'Buy Zone'}</span>
            </div>
            <div className="ta-zone-range">
              <span className="ta-zone-price">{formatPrice(zone.price_low)}</span>
              <span className="ta-zone-separator">-</span>
              <span className="ta-zone-price">{formatPrice(zone.price_high)}</span>
            </div>
          </div>
        )}

        {/* Trade Levels */}
        <div className="ta-levels-container">
          {stopLoss && (
            <div className="ta-level-card sl">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ta-level-icon">
                <circle cx="12" cy="12" r="10"/>
                <path d="M4.93 4.93L19.07 19.07"/>
              </svg>
              <div className="ta-level-info">
                <span className="ta-level-label">Stop Loss</span>
                <span className="ta-level-value">{formatPrice(stopLoss)}</span>
              </div>
            </div>
          )}
          {takeProfit1 && (
            <div className="ta-level-card tp">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ta-level-icon">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8V12L14 14"/>
              </svg>
              <div className="ta-level-info">
                <span className="ta-level-label">Take Profit 1</span>
                <span className="ta-level-value">{formatPrice(takeProfit1)}</span>
              </div>
            </div>
          )}
          {takeProfit2 && (
            <div className="ta-level-card tp">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ta-level-icon">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
              </svg>
              <div className="ta-level-info">
                <span className="ta-level-label">Take Profit 2</span>
                <span className="ta-level-value">{formatPrice(takeProfit2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Chart */}
        {charts && charts.length > 0 ? (
          <div className="ta-chart-section">
            <div className="ta-chart-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ta-chart-icon">
                <path d="M3 3V21H21"/><path d="M7 14L11 10L15 14L21 8"/>
              </svg>
              <span>Technical Chart</span>
            </div>
            <div className="ta-chart-container">
              <img
                src={charts[charts.length - 1].image}
                alt={`${pair} Chart`}
                className="ta-chart-image"
              />
            </div>
          </div>
        ) : (
          <div className="ta-chart-unavailable">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="ta-chart-unavailable-icon">
              <path d="M3 3V21H21"/><path d="M7 14L11 10L15 14L21 8"/>
            </svg>
            <p>Chart visualization unavailable</p>
            <span>Use the trading levels above for your analysis</span>
          </div>
        )}

        {/* Validation Issues */}
        {!valid && validation && (
          <div className="ta-validation-section">
            <div className="ta-validation-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ta-validation-icon">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <path d="M12 9V13M12 17H12.01"/>
              </svg>
              <span>Validation Issues</span>
            </div>
            <div className="ta-validation-list">
              {validation.daily?.errors?.map((err, i) => (
                <div key={`d-err-${i}`} className="ta-validation-item error">
                  <span className="ta-validation-bullet">•</span>
                  {err}
                </div>
              ))}
              {validation.m30?.errors?.map((err, i) => (
                <div key={`m-err-${i}`} className="ta-validation-item error">
                  <span className="ta-validation-bullet">•</span>
                  {err}
                </div>
              ))}
              {validation.daily?.warnings?.map((w, i) => (
                <div key={`d-warn-${i}`} className="ta-validation-item warning">
                  <span className="ta-validation-bullet">•</span>
                  {w}
                </div>
              ))}
              {validation.m30?.warnings?.map((w, i) => (
                <div key={`m-warn-${i}`} className="ta-validation-item warning">
                  <span className="ta-validation-bullet">•</span>
                  {w}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reasoning */}
        {reasoning && (
          <details className="ta-reasoning-section">
            <summary className="ta-reasoning-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ta-reasoning-icon">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                <path d="M12 16V12M12 8H12.01"/>
              </svg>
              <span>AI Analysis Details</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ta-reasoning-chevron">
                <path d="M6 9L12 15L18 9"/>
              </svg>
            </summary>
            <div className="ta-reasoning-content">
              {reasoning}
            </div>
          </details>
        )}

        {/* Actions */}
        <div className="ta-action-buttons">
          <button className="ta-btn ta-btn-primary" onClick={handleRetry}>
            <span className="ta-btn-bg"></span>
            <span className="ta-btn-content">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ta-btn-icon">
                <path d="M1 4V10H7M23 20V14H17"/>
                <path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14L18.36 18.36A9 9 0 013.51 15"/>
              </svg>
              New Analysis
            </span>
          </button>
          <button className="ta-btn ta-btn-secondary" onClick={handleBackToMenu}>
            <span className="ta-btn-content">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ta-btn-icon">
                <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"/>
                <path d="M9 22V12H15V22"/>
              </svg>
              Back to Menu
            </span>
          </button>
        </div>

        {/* Timestamp */}
        <div className="ta-timestamp">
          Generated: {new Date(analysisResult.timestamp).toLocaleString()}
        </div>
      </div>
    );
  };

  return (
    <div className="ta-container">
      <div className="ta-background">
        <div className="ta-bg-gradient"></div>
        <div className="ta-bg-grid"></div>
        <div className="ta-bg-glow glow-1"></div>
        <div className="ta-bg-glow glow-2"></div>
      </div>

      <div className={`ta-wrapper ${isTransitioning ? 'transitioning' : ''}`} ref={cardRef}>
        {step === 'login' && renderLogin()}
        {step === 'market' && renderMarketSelection()}
        {step === 'pair' && renderPairSelection()}
        {step === 'strategy' && renderStrategySelection()}
        {step === 'analyzing' && renderAnalyzing()}
        {step === 'result' && renderResult()}
      </div>
    </div>
  );
};

export default TradingAnalysis;
