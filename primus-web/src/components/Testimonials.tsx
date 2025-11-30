import React from 'react';

const Testimonials: React.FC = () => {
  const reviews = [
    {
      name: '@forex.daily',
      role: '2 weeks ago',
      rating: 5,
      text: 'bro this actually works 😭 caught a 40 pip move on gold yesterday. been testing for 2 weeks and hit rate is solid. way better than those fake signal groups',
      verified: true
    },
    {
      name: '@tradewithleo',
      role: '1 month ago',
      rating: 5,
      text: 'been scalping with this for 3 months. around 70% win rate which is crazy good. the confidence scores help me know when to go heavy or light. already paid for itself 10x over',
      verified: true
    },
    {
      name: '@pip.hunter',
      role: '3 weeks ago',
      rating: 5,
      text: 'switched from my old signal provider and honestly no regrets. made back the subscription in week 1 lol. the AI actually explains WHY it\'s giving signals which helps me learn',
      verified: true
    },
    {
      name: '@crypto_morgan',
      role: '2 months ago',
      rating: 4,
      text: 'pretty good for tokyo session. sometimes signals come late when market goes crazy but overall really helpful. caught patterns i completely missed 👀',
      verified: true
    },
    {
      name: '@daytrader.kai',
      role: '5 weeks ago',
      rating: 5,
      text: 'not gonna lie this is solid. way better than staring at charts all day. gbp/usd swing signals have been printing. support team is quick too when i had questions',
      verified: true
    },
    {
      name: '@chart.wizard',
      role: '1 month ago',
      rating: 5,
      text: 'did the free trial, upgraded same day 💯 saves me SO much time. win rate went from 55% to 68% since i started using this. had some losses but that\'s normal trading',
      verified: true
    },
    {
      name: '@trade.avenue',
      role: '6 days ago',
      rating: 5,
      text: 'held a EUR trade for 3 days based on the signal and banked 120 pips 🔥 the stop loss levels make sense too, not ridiculously tight like other bots',
      verified: true
    },
    {
      name: '@gold.rush.fx',
      role: '3 weeks ago',
      rating: 5,
      text: 'gold trading used to stress me out. this bot breaks down the trends so clearly. still learning but seeing real improvement. the chart analysis is next level',
      verified: true
    },
    {
      name: '@trading.saga',
      role: '2 months ago',
      rating: 4,
      text: 'perfect for part-time trading since i have a day job. telegram notifications are clutch. made 8% last month 📈 only thing is i wish it had more pairs',
      verified: true
    },
    {
      name: '@scalp.king',
      role: '1 week ago',
      rating: 5,
      text: 'scalping strategy is INTENSE but profitable if you can focus. catching 15-20 pip moves regularly. lose about 25% of trades but winners are bigger. very happy with results ngl',
      verified: true
    },
    {
      name: '@fx.journal',
      role: '2 months ago',
      rating: 5,
      text: 'using for 8 weeks now. catches reversals really well. had one bad week but up 12% overall. the confidence scores help me skip sketchy setups. def try the free trial first',
      verified: true
    },
    {
      name: '@market.moves',
      role: '4 weeks ago',
      rating: 5,
      text: 'tested with small positions first, now going full size. gbp/usd signals have been accurate af. not just buy/sell but explains the WHY and where to place stops. game changer fr',
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
                  <span className="verified-badge">{review.role}</span>
                )}
              </div>
              <p className="review-text">{review.text}</p>
              <div className="review-author">
                <img 
                  src={`https://i.pravatar.cc/150?img=${index + 1}`} 
                  alt={review.name}
                  className="author-avatar"
                />
                <div>
                  <div className="author-name">{review.name}</div>
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
                  <span className="verified-badge">{review.role}</span>
                )}
              </div>
              <p className="review-text">{review.text}</p>
              <div className="review-author">
                <img 
                  src={`https://i.pravatar.cc/150?img=${index + 7}`} 
                  alt={review.name}
                  className="author-avatar"
                />
                <div>
                  <div className="author-name">{review.name}</div>
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>

        <div className="reviews-footer">
          <p className="reviews-count">Showing 12 recent Instagram comments from 847+ reviews</p>
      
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
          color: var(--text-muted);
          text-transform: none;
          letter-spacing: 0.02em;
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
          object-fit: cover;
          flex-shrink: 0;
          border: 2px solid rgba(255, 107, 53, 0.2);
        }

        .author-name {
          color: var(--text-primary);
          font-weight: 600;
          font-size: 0.9rem;
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
