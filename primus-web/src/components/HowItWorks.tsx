import React from 'react';

const HowItWorks: React.FC = () => {
  const steps = [
    {
      number: '01',
      title: 'Connect to Telegram',
      description: 'Start a conversation with Primus GPT bot on Telegram. Simple, secure, and instant access.',
      detail: 'No downloads required'
    },
    {
      number: '02',
      title: 'Select Market & Strategy',
      description: 'Choose Gold (XAU/USD) or Forex pairs, then pick your strategy: Swing for position trades or Scalping for quick moves.',
      detail: 'Flexible approach'
    },
    {
      number: '03',
      title: 'AI Analysis Begins',
      description: 'Our AI fetches real-time data, analyzes multiple timeframes, validates patterns, and generates professional charts.',
      detail: '6-step process'
    },
    {
      number: '04',
      title: 'Receive Signal',
      description: 'Get clear BUY/SELL signals with confidence scores, entry zones, patterns, trends, and full reasoning.',
      detail: 'Actionable insights'
    }
  ];

  return (
    <section id="how-it-works" className="how-it-works">
      <div className="glow-top-left"></div>
      <div className="glow-bottom-right"></div>
      <div className="container">
        <h2 className="section-title">
          How <span className="text-gradient">Primus GPT</span> Works
        </h2>
        <p className="section-subtitle">
          From market selection to actionable signals in seconds. Our streamlined process ensures you never miss an opportunity.
        </p>

        <div className="steps-container">
          {steps.map((step, index) => (
            <div key={index} className="step-card">
              <div className="step-number text-gradient">{step.number}</div>
              <div className="step-content">
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
                <div className="step-detail">{step.detail}</div>
              </div>
              {index < steps.length - 1 && (
                <div className="step-connector">
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <path d="M10 20L30 20M30 20L23 13M30 20L23 27" stroke="url(#gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <defs>
                      <linearGradient id="gradient" x1="10" y1="20" x2="30" y2="20">
                        <stop offset="0%" stopColor="#ff6b35"/>
                        <stop offset="100%" stopColor="#a855f7"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .how-it-works {
          padding: 6rem 0;
          background: var(--bg-primary);
          position: relative;
          overflow: hidden;
        }

        .glow-top-left {
          position: absolute;
          top: 10%;
          left: 5%;
          width: 450px;
          height: 450px;
          background: radial-gradient(circle, rgba(255, 107, 53, 0.12) 0%, transparent 70%);
          border-radius: 50%;
          filter: blur(110px);
          pointer-events: none;
          animation: float 12s ease-in-out infinite;
        }

        .glow-bottom-right {
          position: absolute;
          bottom: 10%;
          right: 5%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, transparent 70%);
          border-radius: 50%;
          filter: blur(110px);
          pointer-events: none;
          animation: float 14s ease-in-out infinite reverse;
        }

        @keyframes float {
          0%, 100% { 
            transform: translate(0, 0);
          }
          50% { 
            transform: translate(35px, -35px);
          }
        }

        .how-it-works::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: var(--gradient-primary);
          opacity: 0.2;
        }

        .steps-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
          margin-top: 4rem;
          position: relative;
        }

        .step-card {
          position: relative;
          background: rgba(255, 255, 255, 0.02);
          padding: 2.5rem;
          border-radius: 16px;
          border: 1px solid var(--border-subtle);
          transition: all 0.4s ease;
        }

        .step-card:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 107, 53, 0.3);
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(255, 107, 53, 0.15);
        }

        .step-number {
          font-size: 3.5rem;
          font-weight: 900;
          line-height: 1;
          margin-bottom: 1.5rem;
          opacity: 0.8;
          letter-spacing: -0.02em;
        }

        .step-content {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .step-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.01em;
        }

        .step-description {
          color: var(--text-secondary);
          line-height: 1.7;
          font-size: 1rem;
        }

        .step-detail {
          display: inline-block;
          padding: 0.5rem 1rem;
          background: rgba(255, 107, 53, 0.1);
          border: 1px solid rgba(255, 107, 53, 0.2);
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--accent-orange);
          align-self: flex-start;
        }

        .step-connector {
          position: absolute;
          right: -2.5rem;
          top: 50%;
          transform: translateY(-50%);
          opacity: 0.5;
          display: none;
        }

        @media (min-width: 1024px) {
          .steps-container {
            grid-template-columns: repeat(4, 1fr);
          }
          
          .step-connector {
            display: block;
          }
        }

        @media (max-width: 1023px) {
          .steps-container {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .steps-container {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
};

export default HowItWorks;
