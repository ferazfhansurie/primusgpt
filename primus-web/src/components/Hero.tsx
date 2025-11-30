import React from 'react';

const Hero: React.FC = () => {
  return (
    <section className="hero-section">
      <div className="hero-background">
        <div className="glow-orb glow-orb-1"></div>
        <div className="glow-orb glow-orb-2"></div>
        <div className="glow-orb glow-orb-3"></div>
        <video
          autoPlay
          loop
          muted
          playsInline
          className="hero-bg-media"
        >
          <source src="/Primus_GPT_Bot_Simulation_Video.mp4" type="video/mp4" />
        </video>
        <div className="hero-overlay"></div>
      </div>

      <div className="container flex flex-col items-center hero-content">
        <div className="badge">
          <span className="text-gradient">AI-Powered</span> Trading Intelligence
        </div>
        <h1 className="hero-title">
          Master Gold & Forex
        </h1>
        <p className="hero-subtitle">
          Professional AI trading analysis on Telegram. Get validated signals, multi-timeframe insights, and professional charts for XAU/USD and major currency pairs. Swing & Scalping strategies available.
        </p>

        <div className="cta-group flex gap-4">
          <button className="btn btn-primary"><span>Start Trading Now</span></button>

        </div>
      </div>

      <style>{`
        .hero-section {
          position: relative;
          height: 100vh;
          min-height: 700px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: 0;
          background: #000;
        }

        .hero-background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
        }

        .glow-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.2;
          pointer-events: none;
          z-index: 1;
        }

        .glow-orb-1 {
          top: 10%;
          left: 15%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, #ff6b35 0%, transparent 70%);
          animation: float 10s ease-in-out infinite;
        }

        .glow-orb-2 {
          bottom: 15%;
          right: 10%;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, #a855f7 0%, transparent 70%);
          animation: float 12s ease-in-out infinite reverse;
        }

        .glow-orb-3 {
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, #ff8c42 0%, transparent 70%);
          animation: pulse 8s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { 
            transform: translate(0, 0);
          }
          50% { 
            transform: translate(40px, -40px);
          }
        }

        @keyframes pulse {
          0%, 100% { 
            opacity: 0.15;
            transform: translate(-50%, -50%) scale(1);
          }
          50% { 
            opacity: 0.25;
            transform: translate(-50%, -50%) scale(1.2);
          }
        }

        .hero-bg-media {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          opacity: 0.6;
        }

        .hero-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle at center, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.8) 100%);\n          transition: background 0.4s ease;\n        }

        .hero-section:hover .hero-overlay {
          background: radial-gradient(circle at center, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.9) 100%);\n        }

        .hero-content {
          position: relative;
          z-index: 10;
          opacity: 0;
          transform: translateY(30px);
          animation: heroFadeIn 1s ease-out 0.3s forwards;
        }

        @keyframes heroFadeIn {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Enhanced hover effect */
        .hero-section:hover .hero-content {
          animation: none;
          opacity: 1;
          transform: translateY(0) scale(1.02);
          transition: transform 0.4s ease;
        }
        
        .badge {
          background: rgba(255, 107, 53, 0.15);\n          border: 1px solid rgba(255, 107, 53, 0.3);\n          padding: 0.5rem 1rem;\n          border-radius: 999px;\n          font-size: 0.875rem;\n          margin-bottom: 2rem;\n          backdrop-filter: blur(8px);\n          display: inline-block;\n          font-weight: 600;\n          box-shadow: 0 4px 12px rgba(255, 107, 53, 0.2);\n          transition: all 0.3s ease;\n        }\n\n        .badge:hover {\n          background: rgba(255, 107, 53, 0.2);\n          border-color: rgba(255, 107, 53, 0.5);\n          box-shadow: 0 6px 16px rgba(255, 107, 53, 0.3);\n          transform: translateY(-2px);\n        }

        .hero-title {
          font-size: 4rem;\n          line-height: 1.1;\n          font-weight: 900;\n          text-align: center;\n          margin-bottom: 2rem;\n          color: #fff;\n          text-shadow: 0 4px 20px rgba(0, 0, 0, 0.8);\n          letter-spacing: -0.02em;\n        }
        
        .hero-subtitle {
          font-size: 1.25rem;\n          color: #e5e5e5;\n          text-align: center;\n          max-width: 700px;\n          margin-bottom: 3rem;\n          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);\n          line-height: 1.7;\n          font-weight: 400;\n        }\n\n        @media (max-width: 768px) {\n          .hero-title {\n            font-size: 2.5rem;\n          }\n          .hero-subtitle {\n            font-size: 1rem;\n          }\n        }
      `}</style>
    </section>
  );
};

export default Hero;
