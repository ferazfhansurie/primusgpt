import React from 'react';

const Features: React.FC = () => {
  const features = [
    {
      icon: '🎯',
      title: 'Dual Strategy System',
      description: 'Choose between Swing and Scalping strategies, each optimized for different trading styles and timeframes.',
      highlight: 'Swing & Scalping'
    },
    {
      icon: '📊',
      title: 'Multi-Timeframe Analysis',
      description: 'Comprehensive analysis across multiple timeframes. Swing uses Daily + M30, Scalping uses 15min + 5min for precise entries.',
      highlight: 'Smart Timeframes'
    },
    {
      icon: '🤖',
      title: 'AI-Powered Validation',
      description: 'Advanced AI validates every setup with confidence scores, trend analysis, and pattern recognition before signaling.',
      highlight: '85%+ Accuracy'
    },
    {
      icon: '📈',
      title: 'Professional Charts',
      description: 'Auto-generated technical charts with support/resistance zones, patterns, and key levels for visual confirmation.',
      highlight: 'Visual Analysis'
    },
    {
      icon: '⚡',
      title: 'Instant Telegram Alerts',
      description: 'Receive real-time analysis directly on Telegram with clear signals, entry zones, and risk management guidance.',
      highlight: 'Real-Time'
    },
    {
      icon: '🛡️',
      title: 'Risk Management',
      description: 'Every signal includes validated entry zones, stop-loss levels, and take-profit targets for proper risk control.',
      highlight: 'Protected Trading'
    }
  ];

  return (
    <section id="features" className="features-section">
      <div className="glow-orb-left"></div>
      <div className="glow-orb-right"></div>
      <div className="container">
        <h2 className="section-title">
          Advanced Trading <span className="text-gradient">Intelligence</span>
        </h2>
        <p className="section-subtitle">
          Powered by sophisticated AI algorithms that analyze market structure, patterns, and multi-timeframe confluence to deliver high-probability trading setups.
        </p>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card-advanced">
              <div className="feature-icon">{feature.icon}</div>
              <div className="feature-badge">{feature.highlight}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .features-section {
          padding: 6rem 0;
          background: linear-gradient(to bottom, rgba(255, 107, 53, 0.02) 0%, transparent 50%, rgba(168, 85, 247, 0.02) 100%);
          position: relative;
          overflow: hidden;
        }

        .glow-orb-left {
          position: absolute;
          top: 20%;
          left: -100px;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(255, 107, 53, 0.15) 0%, transparent 70%);
          border-radius: 50%;
          filter: blur(100px);
          pointer-events: none;
          animation: float 10s ease-in-out infinite;
        }

        .glow-orb-right {
          position: absolute;
          bottom: 20%;
          right: -100px;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, transparent 70%);
          border-radius: 50%;
          filter: blur(100px);
          pointer-events: none;
          animation: float 12s ease-in-out infinite reverse;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, -30px); }
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 2rem;
          margin-top: 4rem;
        }

        .feature-card-advanced {
          background: rgba(255, 255, 255, 0.02);
          padding: 2.5rem;
          border-radius: 20px;
          border: 1px solid var(--border-subtle);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .feature-card-advanced::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--gradient-primary);
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .feature-card-advanced:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 107, 53, 0.3);
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(255, 107, 53, 0.15);
        }

        .feature-card-advanced:hover::before {
          opacity: 1;
        }

        .feature-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          filter: grayscale(20%);
          transition: filter 0.3s ease;
        }

        .feature-card-advanced:hover .feature-icon {
          filter: grayscale(0%);
        }

        .feature-badge {
          display: inline-block;
          padding: 0.375rem 0.875rem;
          background: rgba(255, 107, 53, 0.1);
          border: 1px solid rgba(255, 107, 53, 0.3);
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--accent-orange);
          margin-bottom: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .feature-title {
          font-size: 1.375rem;
          margin-bottom: 1rem;
          color: #fff;
          font-weight: 700;
          letter-spacing: -0.01em;
        }

        .feature-desc {
          color: var(--text-secondary);
          line-height: 1.7;
          font-size: 1rem;
        }
      `}</style>
    </section>
  );
};

export default Features;
