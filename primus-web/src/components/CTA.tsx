import React from 'react';

const CTA: React.FC = () => {
  return (
    <section className="cta-section">
      <div className="cta-background">
        <div className="cta-glow cta-glow-1"></div>
        <div className="cta-glow cta-glow-2"></div>
      </div>
      
      <div className="container">
        <div className="cta-content">
          <h2 className="cta-title">
            Ready to Transform Your <span className="text-gradient">Trading Journey?</span>
          </h2>
          <p className="cta-subtitle">
            Join thousands of traders using AI-powered analysis to make smarter, more confident trading decisions. Start with instant access via Telegram.
          </p>
          
          <div className="cta-buttons">
            <button className="btn btn-primary btn-large">
              <span>Start Free on Telegram</span>
            </button>
           
          </div>

          <div className="cta-features">
            <div className="cta-feature">
              <svg className="cta-check" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>No credit card required</span>
            </div>
            <div className="cta-feature">
              <svg className="cta-check" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Instant Telegram access</span>
            </div>
            <div className="cta-feature">
              <svg className="cta-check" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .cta-section {
          padding: 8rem 0;
          position: relative;
          overflow: hidden;
          background: var(--bg-primary);
        }

        .cta-background {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .cta-glow {
          position: absolute;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.15;
        }

        .cta-glow-1 {
          background: radial-gradient(circle, #ff6b35 0%, transparent 70%);
          top: -200px;
          left: -100px;
        }

        .cta-glow-2 {
          background: radial-gradient(circle, #a855f7 0%, transparent 70%);
          bottom: -200px;
          right: -100px;
        }

        .cta-content {
          position: relative;
          z-index: 1;
          text-align: center;
          max-width: 900px;
          margin: 0 auto;
        }

        .cta-title {
          font-size: 3.5rem;
          font-weight: 900;
          line-height: 1.2;
          margin-bottom: 1.5rem;
          letter-spacing: -0.02em;
          color: #fff;
        }

        .cta-subtitle {
          font-size: 1.25rem;
          color: var(--text-secondary);
          line-height: 1.7;
          margin-bottom: 3rem;
          max-width: 700px;
          margin-left: auto;
          margin-right: auto;
        }

        .cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 3rem;
        }

        .btn-large {
          padding: 1.25rem 2.5rem;
          font-size: 1.125rem;
        }

        .cta-features {
          display: flex;
          gap: 2.5rem;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
        }

        .cta-feature {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-secondary);
          font-size: 0.95rem;
        }

        .cta-check {
          width: 18px;
          height: 18px;
          color: var(--accent-orange);
        }

        @media (max-width: 768px) {
          .cta-section {
            padding: 5rem 0;
          }

          .cta-title {
            font-size: 2.25rem;
          }

          .cta-subtitle {
            font-size: 1rem;
          }

          .cta-buttons {
            flex-direction: column;
          }

          .btn-large {
            width: 100%;
          }

          .cta-features {
            flex-direction: column;
            gap: 1rem;
          }
        }
      `}</style>
    </section>
  );
};

export default CTA;
