import React, { type ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  React.useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [mobileMenuOpen]);

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="app-wrapper">
      <header className={`header ${scrolled ? 'scrolled' : ''}`}>
        <div className="container flex items-center justify-between">
          <div className="logo">
            <img src="/logo.jpg" alt="Primus GPT" className="logo-img" />
          </div>
          <nav className="nav-links desktop-nav">
            <a href="#features" className="nav-link">
              <span>Features</span>
            </a>
            <a href="#markets" className="nav-link">
              <span>Markets</span>
            </a>
            <a href="#how-it-works" className="nav-link">
              <span>How It Works</span>
            </a>
            <a href="/register" className="nav-link">
              <span>Register</span>
            </a>
          </nav>
          <div className="header-actions">
            <button className="btn btn-secondary text-sm desktop-only"><span>Sign In</span></button>
            <button 
              className="mobile-menu-toggle" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <span className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}></span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <nav className="mobile-nav">
          <a href="#features" className="mobile-nav-link" onClick={handleNavClick}>
            Features
          </a>
          <a href="#markets" className="mobile-nav-link" onClick={handleNavClick}>
            Markets
          </a>
          <a href="#how-it-works" className="mobile-nav-link" onClick={handleNavClick}>
            How It Works
          </a>
          <a href="/register" className="mobile-nav-link" onClick={handleNavClick}>
            Register
          </a>
          <button className="btn btn-primary mobile-nav-btn" onClick={handleNavClick}>
            <span>Sign In</span>
          </button>
        </nav>
      </div>

      <main>{children}</main>

      <footer className="footer">
        <div className="container text-center">
          <p className="copyright">© 2025 Primus GPT. All rights reserved.</p>
          <p className="disclaimer">Trading involves risk. Past performance is not indicative of future results.</p>
        </div>
      </footer>

      <style>{`
        .header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 80px;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(16px) saturate(180%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          z-index: 100;
          display: flex;
          align-items: center;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .header.scrolled {
          background: rgba(0, 0, 0, 0.95);
          border-bottom: 1px solid rgba(255, 107, 53, 0.2);
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4), 0 0 40px rgba(255, 107, 53, 0.1);
          height: 70px;
        }

        .container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          z-index: 101;
        }

        .logo-img {
          height: 45px;
          width: auto;
          object-fit: contain;
          filter: drop-shadow(0 0 10px rgba(255, 107, 53, 0.3));
          transition: all 0.3s ease;
        }

        .header.scrolled .logo-img {
          height: 38px;
        }

        .logo:hover .logo-img {
          filter: drop-shadow(0 0 20px rgba(255, 107, 53, 0.6));
          transform: scale(1.05);
        }

        .nav-links {
          display: flex;
          gap: 0.5rem;
        }

        .desktop-nav {
          display: none;
        }

        @media (min-width: 769px) {
          .desktop-nav {
            display: flex;
          }
        }

        .nav-link {
          color: var(--text-secondary);
          font-size: 0.95rem;
          font-weight: 500;
          position: relative;
          padding: 0.625rem 1.25rem;
          border-radius: 8px;
          transition: all 0.3s ease;
          letter-spacing: 0.025em;
        }

        .nav-link span {
          position: relative;
          z-index: 1;
        }

        .nav-link::before {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(255, 107, 53, 0.1);
          border-radius: 8px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .nav-link::after {
          content: '';
          position: absolute;
          bottom: 8px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 2px;
          background: var(--gradient-primary);
          transition: width 0.3s ease;
        }

        .nav-link:hover {
          color: #fff;
        }

        .nav-link:hover::before {
          opacity: 1;
        }

        .nav-link:hover::after {
          width: calc(100% - 2.5rem);
        }

        .header-actions {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }

        .desktop-only {
          display: none;
        }

        @media (min-width: 769px) {
          .desktop-only {
            display: block;
          }
        }

        .btn-secondary {
          background: transparent;
          border: 1.5px solid rgba(255, 255, 255, 0.15);
          color: var(--text-primary);
          padding: 0.625rem 1.5rem;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .btn-secondary::before {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(255, 255, 255, 0.05);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .btn-secondary span {
          position: relative;
          z-index: 1;
        }

        .btn-secondary:hover {
          border-color: rgba(255, 107, 53, 0.5);
          transform: translateY(-1px);
        }

        .btn-secondary:hover::before {
          opacity: 1;
        }

        /* Mobile Menu Toggle */
        .mobile-menu-toggle {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          width: 40px;
          height: 40px;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
          z-index: 101;
          position: relative;
        }

        @media (min-width: 769px) {
          .mobile-menu-toggle {
            display: none;
          }
        }

        .hamburger {
          position: relative;
          width: 24px;
          height: 2px;
          background: #fff;
          transition: all 0.3s ease;
          border-radius: 2px;
        }

        .hamburger::before,
        .hamburger::after {
          content: '';
          position: absolute;
          width: 24px;
          height: 2px;
          background: #fff;
          transition: all 0.3s ease;
          border-radius: 2px;
        }

        .hamburger::before {
          top: -7px;
        }

        .hamburger::after {
          bottom: -7px;
        }

        .hamburger.open {
          background: transparent;
        }

        .hamburger.open::before {
          transform: rotate(45deg);
          top: 0;
        }

        .hamburger.open::after {
          transform: rotate(-45deg);
          bottom: 0;
        }

        /* Mobile Menu */
        .mobile-menu {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100vh;
          background: rgba(0, 0, 0, 0.98);
          backdrop-filter: blur(20px);
          z-index: 99;
          display: flex;
          justify-content: center;
          align-items: center;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }

        .mobile-menu.open {
          opacity: 1;
          pointer-events: all;
        }

        .mobile-nav {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          text-align: center;
          padding: 2rem;
        }

        .mobile-nav-link {
          color: var(--text-primary);
          font-size: 1.5rem;
          font-weight: 600;
          padding: 1rem;
          border-radius: 12px;
          transition: all 0.3s ease;
          position: relative;
        }

        .mobile-nav-link::before {
          content: '';
          position: absolute;
          inset: 0;
          background: var(--gradient-subtle);
          border-radius: 12px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .mobile-nav-link:active {
          transform: scale(0.95);
        }

        .mobile-nav-link:active::before {
          opacity: 1;
        }

        .mobile-nav-btn {
          margin-top: 1rem;
          width: 100%;
        }

        @media (min-width: 769px) {
          .mobile-menu {
            display: none;
          }
        }

        /* Responsive Header */
        @media (max-width: 768px) {
          .header {
            height: 64px;
          }
          
          .header.scrolled {
            height: 60px;
          }

          .logo-img {
            height: 36px;
          }

          .header.scrolled .logo-img {
            height: 32px;
          }

          .container {
            padding: 0 1rem;
          }
        }

        @media (max-width: 480px) {
          .header {
            height: 60px;
          }

          .logo-img {
            height: 32px;
          }

          .header.scrolled .logo-img {
            height: 28px;
          }
        }

        .footer {
          padding: 4rem 0;
          border-top: 1px solid var(--border-color);
          margin-top: 6rem;
          background: linear-gradient(to bottom, transparent 0%, rgba(255, 107, 53, 0.03) 100%);
          position: relative;
          overflow: hidden;
        }

        .footer::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 400px;
          height: 200px;
          background: radial-gradient(ellipse, rgba(168, 85, 247, 0.08) 0%, transparent 70%);
          filter: blur(80px);
          pointer-events: none;
        }

        .copyright {
          color: #fff;
          margin-bottom: 0.75rem;
          font-weight: 500;
          font-size: 0.95rem;
        }

        .disclaimer {
          color: var(--text-muted);
          font-size: 0.8rem;
          max-width: 700px;
          margin: 0 auto;
          line-height: 1.6;
          padding: 0 1rem;
        }

        @media (max-width: 768px) {
          .footer {
            padding: 3rem 0;
            margin-top: 4rem;
          }

          .copyright {
            font-size: 0.875rem;
          }

          .disclaimer {
            font-size: 0.75rem;
          }
        }

        @media (max-width: 480px) {
          .footer {
            padding: 2rem 0;
            margin-top: 3rem;
          }

          .copyright {
            font-size: 0.8rem;
          }

          .disclaimer {
            font-size: 0.7rem;
          }
        }

        /* Main content padding for fixed header */
        main {
          padding-top: 80px;
        }

        @media (max-width: 768px) {
          main {
            padding-top: 64px;
          }
        }

        @media (max-width: 480px) {
          main {
            padding-top: 60px;
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;
