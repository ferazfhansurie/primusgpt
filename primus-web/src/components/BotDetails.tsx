import React from 'react';

const BotDetails: React.FC = () => {
  const features = [
    { 
      title: 'Swing Trading Strategy', 
      desc: 'Position trading with Daily + M30 timeframe analysis. Perfect for longer-term setups and trend following.'
    },
    { 
      title: 'Scalping Strategy', 
      desc: 'Quick trades using 15-min + 5-min timeframe analysis. Ideal for intraday momentum and rapid entries.'
    },
    { 
      title: 'Signal Validation System', 
      desc: 'Every signal validated with confidence scoring, pattern recognition, and trend alignment before delivery.'
    },
    { 
      title: 'Professional Charts', 
      desc: 'Auto-generated technical charts showing support/resistance zones, entry points, and key price levels.'
    },
  ];

  return (
    <section className="details-section">
      <div className="glow-center-pulse"></div>
      <div className="container">
        <h2 className="section-title">Powerful Trading <span className="text-gradient">Features</span></h2>
        <p className="section-subtitle">
          Everything you need for successful trading, powered by advanced AI and delivered instantly via Telegram.
        </p>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .details-section {
          position: relative;
          overflow: hidden;
        }

        .glow-center-pulse {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 550px;
          height: 550px;
          background: radial-gradient(circle, rgba(255, 140, 66, 0.1) 0%, transparent 70%);
          border-radius: 50%;
          filter: blur(120px);
          pointer-events: none;
          animation: pulse 6s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { 
            opacity: 0.4;
            transform: translate(-50%, -50%) scale(1);
          }
          50% { 
            opacity: 0.8;
            transform: translate(-50%, -50%) scale(1.15);
          }
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
          margin-top: 4rem;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.02);\n          padding: 2.5rem;\n          border-radius: 16px;\n          border: 1px solid var(--border-subtle);\n          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);\n          position: relative;\n          overflow: hidden;\n        }

        .feature-card::before {\n          content: '';\n          position: absolute;\n          top: 0;\n          left: 0;\n          right: 0;\n          height: 3px;\n          background: var(--gradient-primary);\n          opacity: 0;\n          transition: opacity 0.4s ease;\n        }

        .feature-card:hover {\n          background: rgba(255, 255, 255, 0.04);\n          border-color: rgba(255, 107, 53, 0.3);\n          transform: translateY(-8px);\n          box-shadow: 0 20px 40px rgba(255, 107, 53, 0.15), 0 0 30px rgba(168, 85, 247, 0.1);\n        }

        .feature-card:hover::before {\n          opacity: 1;\n        }

        .feature-title {
          font-size: 1.375rem;\n          margin-bottom: 1rem;\n          color: #fff;\n          font-weight: 700;\n          letter-spacing: -0.01em;\n        }

        .feature-desc {
          color: var(--text-secondary);\n          line-height: 1.7;\n          font-size: 1rem;\n        }
      `}</style>
    </section>
  );
};

export default BotDetails;
