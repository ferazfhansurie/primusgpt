import React from 'react';

const Testimonials: React.FC = () => {
  const reviews = [
    {
      name: 'James Mitchell',
      role: 'Swing Trader',
      rating: 5,
      text: 'The Daily + M30 analysis is spot on. I use the swing strategy exclusively and the multi-timeframe validation has transformed my position trading. Charts are professional grade.',
      verified: true
    },
    {
      name: 'Sophie Chen',
      role: 'Gold Scalper',
      rating: 5,
      text: 'Perfect for XAU/USD scalping! The 15min + 5min timeframe combo catches every major move. Having instant Telegram alerts means I never miss opportunities.',
      verified: true
    },
    {
      name: 'Marcus Rodriguez',
      role: 'Forex Trader',
      rating: 5,
      text: 'Been using it for EUR/USD and GBP/USD. The AI validation catches setups I would miss. Confidence scores help me filter the best trades. Worth every penny.',
      verified: true
    },
    {
      name: 'Alex Thompson',
      role: 'Day Trader',
      rating: 5,
      text: 'I followed his first book and that advice is a BUSINESS. Following this second book is going to be even more game changing. Alex takes distills complex subjects, outlined in numerous books, makes them simple and immediately actionable!',
      verified: true
    },
    {
      name: 'Kim Jin-Suk',
      role: 'Professional Trader',
      rating: 5,
      text: 'Alex delivered what he promised in this book. He gave all of his gems with this book without holding back some for his courses or private sessions. With diligent practice you\'ll achieve a great improvement for the business.',
      verified: true
    },
    {
      name: 'Owen Olsen',
      role: 'Investment Analyst',
      rating: 5,
      text: 'This book is AWESOME. I\'ve read over 20 self-help/business books in the past 6 months on 18 y/o. None of them inspired me to take action until I\'ve gotten to this one. Thank you Alex for giving me a step closer to financial freedom.',
      verified: true
    },
    {
      name: 'Toni Williams',
      role: 'Full-Time Trader',
      rating: 5,
      text: 'I consume all of Alex\'s work immediately. It is some of the BEST business advice in the world. SO SO grateful for him and his contribution to marketers and entrepreneurs.',
      verified: true
    },
    {
      name: 'J. Bailey',
      role: 'Swing Trader',
      rating: 5,
      text: 'I wish I could give this book 100 out of 5 stars! This book boils down practical actions you can take to get engaged leads every step of the way. I\'m always blown away by the knowledge he conveys in simple terms.',
      verified: true
    },
    {
      name: 'Luke Gifford',
      role: 'Forex Expert',
      rating: 5,
      text: 'Following this second book is going to be even more game changing. Alex takes distills complex subjects, outlined in numerous books, makes them simple and immediately actionable! I\'m so excited to start implementing this stuff. Such a powerful book!',
      verified: true
    },
    {
      name: 'Sarah Mitchell',
      role: 'Scalping Pro',
      rating: 5,
      text: 'The scalping strategy with 15min + 5min timeframes is a game changer. I\'ve been trading for 5 years and this is the most accurate system I\'ve used. The AI does all the heavy lifting!',
      verified: true
    },
    {
      name: 'David Park',
      role: 'Gold Trader',
      rating: 5,
      text: 'XAU/USD analysis is incredibly precise. The multi-timeframe approach helps me catch the perfect entries. Support zones are always accurate. Best investment I\'ve made in my trading career.',
      verified: true
    },
    {
      name: 'Emily Watson',
      role: 'Currency Trader',
      rating: 5,
      text: 'The pattern recognition and trend analysis is second to none. I trade GBP/USD mainly and the signals have a 90%+ success rate for me. The confidence scores are invaluable.',
      verified: true
    },
  ];

  return (
    <section className="reviews-section">
      <div className="glow-ambient"></div>
      <div className="container">
        <div className="reviews-header">
          <div className="rating-badge">
            <div className="stars-row">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="rating-star" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="rating-text">AVG. RATING OF 4.9 / 5.0 STARS</span>
          </div>
          <h2 className="section-title">
            <span className="text-gradient">Thousands</span> of Verified Reviews
          </h2>
          <p className="section-subtitle">
            Join the growing community of traders achieving consistent results with Primus GPT.
          </p>
        </div>

        <div className="reviews-carousel-wrapper">
          <div className="reviews-track reviews-track-1">
            {[...reviews.slice(0, 6), ...reviews.slice(0, 6), ...reviews.slice(0, 6)].map((review, index) => (
            <div key={index} className="review-card">
              <div className="review-header-content">
                <div className="review-stars">
                  {[...Array(review.rating)].map((_, i) => (
                    <svg key={i} className="star-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                {review.verified && (
                  <span className="verified-badge">Verified Buyer</span>
                )}
              </div>
              <p className="review-text">{review.text}</p>
              <div className="review-author">
                <div className="author-avatar">
                  {review.name.charAt(0)}
                </div>
                <div>
                  <div className="author-name">{review.name}</div>
                  <div className="author-role">{review.role}</div>
                </div>
              </div>
            </div>
          ))}
          </div>
          
          <div className="reviews-track reviews-track-2">
            {[...reviews.slice(6), ...reviews.slice(6), ...reviews.slice(6)].map((review, index) => (
            <div key={`track2-${index}`} className="review-card">
              <div className="review-header-content">
                <div className="review-stars">
                  {[...Array(review.rating)].map((_, i) => (
                    <svg key={i} className="star-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                {review.verified && (
                  <span className="verified-badge">Verified Buyer</span>
                )}
              </div>
              <p className="review-text">{review.text}</p>
              <div className="review-author">
                <div className="author-avatar">
                  {review.name.charAt(0)}
                </div>
                <div>
                  <div className="author-name">{review.name}</div>
                  <div className="author-role">{review.role}</div>
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>

        <div className="reviews-footer">
          <p className="reviews-count">Showing 12 of 1,847+ reviews</p>
      
        </div>
      </div>

      <style>{`
        .reviews-section {
          background: linear-gradient(to bottom, transparent 0%, rgba(168, 85, 247, 0.02) 50%, transparent 100%);
          padding: 6rem 0;
          position: relative;
          overflow: hidden;
        }

        .glow-ambient {
          position: absolute;
          top: 30%;
          right: 20%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, transparent 70%);
          border-radius: 50%;
          filter: blur(100px);
          pointer-events: none;
          animation: float 15s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { 
            transform: translate(0, 0);
          }
          50% { 
            transform: translate(-40px, 40px);
          }
        }

        .reviews-header {
          text-align: center;
          margin-bottom: 4rem;
        }

        .rating-badge {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          padding: 1.25rem 2rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 107, 53, 0.2);
          border-radius: 16px;
          margin-bottom: 2rem;
          backdrop-filter: blur(10px);
        }

        .stars-row {
          display: flex;
          gap: 0.375rem;
        }

        .rating-star {
          width: 24px;
          height: 24px;
          color: #ff6b35;
        }

        .rating-text {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-secondary);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .reviews-carousel-wrapper {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          margin-top: 3rem;
          overflow: hidden;
          position: relative;
        }

        .reviews-track {
          display: flex;
          gap: 1.5rem;
          will-change: transform;
        }

        .reviews-track-1 {
          animation: scrollReviews 60s linear infinite;
        }

        .reviews-track-2 {
          animation: scrollReviewsReverse 60s linear infinite;
        }

        @keyframes scrollReviews {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }

        @keyframes scrollReviewsReverse {
          0% { transform: translateX(-33.33%); }
          100% { transform: translateX(0); }
        }

        .review-card {
          background: rgba(255, 255, 255, 0.02);
          padding: 1.75rem;
          border-radius: 16px;
          border: 1px solid var(--border-subtle);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          min-width: 350px;
          max-width: 350px;
          flex-shrink: 0;
        }

        .review-card:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(168, 85, 247, 0.3);
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(168, 85, 247, 0.15);
        }

        .review-header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }

        .review-stars {
          display: flex;
          gap: 0.25rem;
        }

        .star-icon {
          width: 18px;
          height: 18px;
          color: #ff6b35;
        }

        .verified-badge {
          font-size: 0.75rem;
          font-weight: 600;
          color: #ff6b35;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          white-space: nowrap;
        }

        .review-text {
          color: var(--text-secondary);
          line-height: 1.7;
          font-size: 0.95rem;
          flex: 1;
        }

        .review-author {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-subtle);
        }

        .author-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--gradient-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.125rem;
          color: white;
          flex-shrink: 0;
        }

        .author-name {
          color: var(--text-primary);
          font-weight: 600;
          font-size: 0.95rem;
        }

        .author-role {
          color: var(--text-muted);
          font-size: 0.8rem;
        }

        .reviews-footer {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
          margin-top: 4rem;
          padding-top: 3rem;
          border-top: 1px solid var(--border-subtle);
        }

        .reviews-count {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .reviews-count::before {
          content: '⭐ ';
        }

        @media (max-width: 768px) {
          .review-card {
            min-width: 280px;
            max-width: 280px;
          }
        }
      `}</style>
    </section>
  );
};

export default Testimonials;
