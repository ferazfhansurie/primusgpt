import React from 'react';

const Markets: React.FC = () => {
  const goldFeatures = [
    'XAU/USD real-time analysis',
    'Volatility-optimized strategies',
    'Safe haven trend detection',
    'Session-based momentum'
  ];

  const forexPairs = [
    { pair: 'EUR/USD', name: 'Euro / US Dollar' },
    { pair: 'GBP/USD', name: 'British Pound / US Dollar' },
    { pair: 'USD/JPY', name: 'US Dollar / Japanese Yen' },
    { pair: 'AUD/USD', name: 'Australian Dollar / US Dollar' },
    { pair: 'USD/CAD', name: 'US Dollar / Canadian Dollar' },
    { pair: 'NZD/USD', name: 'New Zealand Dollar / US Dollar' }
  ];

  return (
    <section id="markets" className="markets-section">
      <div className="glow-orb-center"></div>
      <div className="container">
        <h2 className="section-title">
          Supported <span className="text-gradient">Markets</span>
        </h2>
        <p className="section-subtitle">
          Professional analysis for the world's most liquid markets. Choose Gold for volatility or Forex majors for consistent opportunities.
        </p>

        <div className="markets-grid">
          {/* Gold Card */}
          <div className="market-card gold-card">
            <div className="market-header">
              <div className="market-icon">🥇</div>
              <div>
                <h3 className="market-title">Gold Trading</h3>
                <p className="market-subtitle">XAU/USD Spot Analysis</p>
              </div>
            </div>
            
            <div className="market-features">
              {goldFeatures.map((feature, index) => (
                <div key={index} className="market-feature">
                  <svg className="check-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <div className="market-badge">High Volatility</div>
          </div>

          {/* Forex Card */}
          <div className="market-card forex-card">
            <div className="market-header">
              <div className="market-icon">💱</div>
              <div>
                <h3 className="market-title">Forex Majors</h3>
                <p className="market-subtitle">6 Major Currency Pairs</p>
              </div>
            </div>
            
            <div className="forex-pairs">
              {forexPairs.map((item, index) => (
                <div key={index} className="pair-item">
                  <span className="pair-code">{item.pair}</span>
                  <span className="pair-name">{item.name}</span>
                </div>
              ))}
            </div>

            <div className="market-badge">24/5 Trading</div>
          </div>
        </div>

        <div className="markets-note">
          <svg className="info-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p>Both Swing and Scalping strategies available for all instruments. Choose based on your trading style and time commitment.</p>
        </div>
      </div>

      <style>{`
        .markets-section {
          padding: 6rem 0;
          background: var(--bg-secondary);
          position: relative;
          overflow: hidden;
        }

        .glow-orb-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(255, 107, 53, 0.08) 0%, transparent 70%);
          border-radius: 50%;
          filter: blur(120px);
          pointer-events: none;
          animation: pulse 8s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { 
            opacity: 0.5;
            transform: translate(-50%, -50%) scale(1);
          }
          50% { 
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.2);
          }
        }

        .markets-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 2.5rem;
          margin-top: 4rem;
        }

        .market-card {
          background: rgba(255, 255, 255, 0.02);
          padding: 3rem;
          border-radius: 20px;
          border: 1px solid var(--border-subtle);
          transition: all 0.4s ease;
          position: relative;
          overflow: hidden;
        }

        .market-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--gradient-primary);
          transform: scaleX(0);
          transition: transform 0.4s ease;
        }

        .market-card:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 107, 53, 0.3);
          transform: translateY(-8px);
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.3);
        }

        .market-card:hover::before {
          transform: scaleX(1);
        }

        .market-header {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .market-icon {
          font-size: 3.5rem;
          filter: grayscale(20%);
          transition: filter 0.3s ease;
        }

        .market-card:hover .market-icon {
          filter: grayscale(0%);
        }

        .market-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: #fff;
          margin-bottom: 0.25rem;
          letter-spacing: -0.01em;
        }

        .market-subtitle {
          color: var(--text-secondary);
          font-size: 0.95rem;
          font-weight: 500;
        }

        .market-features {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .market-feature {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: var(--text-secondary);
          font-size: 1rem;
        }

        .check-icon {
          width: 20px;
          height: 20px;
          color: var(--accent-orange);
          flex-shrink: 0;
        }

        .forex-pairs {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .pair-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.875rem 1.25rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.3s ease;
        }

        .pair-item:hover {
          background: rgba(255, 107, 53, 0.05);
          border-color: rgba(255, 107, 53, 0.2);
          transform: translateX(4px);
        }

        .pair-code {
          font-weight: 700;
          color: #fff;
          font-size: 1.05rem;
          letter-spacing: 0.025em;
        }

        .pair-name {
          color: var(--text-muted);
          font-size: 0.875rem;
        }

        .market-badge {
          display: inline-block;
          padding: 0.625rem 1.25rem;
          background: rgba(255, 107, 53, 0.1);
          border: 1px solid rgba(255, 107, 53, 0.3);
          border-radius: 999px;
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--accent-orange);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .markets-note {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          margin-top: 3rem;
          padding: 1.5rem 2rem;
          background: rgba(255, 107, 53, 0.05);
          border: 1px solid rgba(255, 107, 53, 0.2);
          border-radius: 12px;
        }

        .info-icon {
          width: 24px;
          height: 24px;
          color: var(--accent-orange);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .markets-note p {
          color: var(--text-secondary);
          line-height: 1.7;
          margin: 0;
        }

        @media (max-width: 768px) {
          .markets-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
};

export default Markets;
