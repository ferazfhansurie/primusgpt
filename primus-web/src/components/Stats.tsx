import React from 'react';

const Stats: React.FC = () => {
  const stats = [
    { value: '85%+', label: 'Win Rate', description: 'Average success rate on validated setups' },
    { value: '6-Step', label: 'AI Validation', description: 'Comprehensive analysis process per signal' },
    { value: '7+', label: 'Instruments', description: 'XAU/USD Gold + 6 Forex major pairs' },
    { value: '2x', label: 'Strategies', description: 'Swing & Scalping for all trading styles' },
  ];

  return (
    <section className="stats-section">
      <div className="glow-line-top"></div>
      <div className="glow-line-bottom"></div>
      <div className="container">
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-value text-gradient">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-description">{stat.description}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .stats-section {
          padding: 4rem 0;
          background: rgba(0, 0, 0, 0.3);
          border-top: 1px solid var(--border-subtle);
          border-bottom: 1px solid var(--border-subtle);
          position: relative;
          overflow: hidden;
        }

        .glow-line-top {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 100px;
          background: linear-gradient(to bottom, rgba(255, 107, 53, 0.1) 0%, transparent 100%);
          pointer-events: none;
        }

        .glow-line-bottom {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 100px;
          background: linear-gradient(to top, rgba(168, 85, 247, 0.08) 0%, transparent 100%);
          pointer-events: none;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 3rem;
        }

        .stat-card {
          text-align: center;
          padding: 1.5rem;
          transition: transform 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-4px);
        }

        .stat-value {
          font-size: 3rem;
          font-weight: 900;
          line-height: 1;
          margin-bottom: 0.75rem;
          letter-spacing: -0.02em;
        }

        .stat-label {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
          letter-spacing: 0.025em;
        }

        .stat-description {
          font-size: 0.875rem;
          color: var(--text-muted);
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 2rem;
          }
          
          .stat-value {
            font-size: 2.25rem;
          }
        }
      `}</style>
    </section>
  );
};

export default Stats;
