import React from 'react';
import carousel1 from '../assets/carousel/carousel_1.png';
import carousel2 from '../assets/carousel/carousel_2.png';
import carousel3 from '../assets/carousel/carousel_3.png';
import carousel4 from '../assets/carousel/carousel_4.png';
import carousel5 from '../assets/carousel/carousel_5.png';

const images = [carousel1, carousel2, carousel3, carousel4, carousel5];

const ImageCarousel: React.FC = () => {
    // Create multiple copies to fill the screen and create seamless loop
    const extendedImages = [...images, ...images, ...images, ...images];
    
    // Split images into two rows
    const row1Images = extendedImages.filter((_, i) => i % 2 === 0);
    const row2Images = extendedImages.filter((_, i) => i % 2 === 1);

    return (
        <section className="carousel-section">
            <div className="container carousel-header">
               
                <h2 className="section-title">
                    Real Trades, <span className="text-gradient">Real Results</span>
                </h2>
                <p className="section-subtitle">
                    Actual trading signals and analysis delivered to our users. See the precision and detail in every chart.
                </p>
            </div>

            <div className="carousel-wrapper">
                <div className="carousel-glow carousel-glow-left"></div>
                <div className="carousel-glow carousel-glow-right"></div>
                
                <div className="gradient-fade gradient-fade-left" />
                <div className="gradient-fade gradient-fade-right" />

                {/* First Row - Left to Right */}
                <div className="carousel-container">
                    <div className="carousel-track carousel-track-1">
                        {row1Images.map((img, index) => (
                            <div
                                key={`row1-${index}`}
                                className="carousel-item relative group flex-shrink-0"
                            >
                                {/* Phone Frame with premium styling */}
                                <div className="phone-frame">
                                    <div className="phone-border"></div>
                                    <div className="phone-inner">
                                        {/* Notch */}
                                        <div className="phone-notch"></div>
                                        
                                        {/* Screen */}
                                        <div className="phone-screen">
                                            <img
                                                src={img}
                                                alt={`Trading Analysis ${(index % images.length) + 1}`}
                                                className="carousel-image"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Second Row - Right to Left */}
                <div className="carousel-container carousel-container-2">
                    <div className="carousel-track carousel-track-2">
                        {row2Images.map((img, index) => (
                            <div
                                key={`row2-${index}`}
                                className="carousel-item relative group flex-shrink-0"
                            >
                                {/* Phone Frame with premium styling */}
                                <div className="phone-frame">
                                    <div className="phone-border"></div>
                                    <div className="phone-inner">
                                        {/* Notch */}
                                        <div className="phone-notch"></div>
                                        
                                        {/* Screen */}
                                        <div className="phone-screen">
                                            <img
                                                src={img}
                                                alt={`Trading Analysis ${(index % images.length) + 1}`}
                                                className="carousel-image"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            
            </div>

            <style>{`
        .carousel-section {
          padding: 6rem 0;
          background: linear-gradient(180deg, var(--bg-primary) 0%, rgba(255, 107, 53, 0.02) 50%, var(--bg-primary) 100%);
          position: relative;
          overflow: hidden;
        }

        .carousel-header {
          text-align: center;
          margin-bottom: 4rem;
          position: relative;
          z-index: 2;
        }

        .section-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1.25rem;
          background: rgba(255, 107, 53, 0.1);
          border: 1px solid rgba(255, 107, 53, 0.3);
          border-radius: 999px;
          margin-bottom: 1.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--accent-orange);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .badge-dot {
          width: 8px;
          height: 8px;
          background: var(--accent-orange);
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        .carousel-wrapper {
          position: relative;
          width: 100%;
          overflow: hidden;
        }

        .carousel-glow {
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          filter: blur(150px);
          opacity: 0.15;
          pointer-events: none;
          z-index: 0;
        }

        .carousel-glow-left {
          background: radial-gradient(circle, #ff6b35 0%, transparent 70%);
          top: 50%;
          left: -200px;
          transform: translateY(-50%);
          animation: float 8s ease-in-out infinite;
        }

        .carousel-glow-right {
          background: radial-gradient(circle, #a855f7 0%, transparent 70%);
          top: 50%;
          right: -200px;
          transform: translateY(-50%);
          animation: float 8s ease-in-out infinite reverse;
        }

        @keyframes float {
          0%, 100% { transform: translateY(-50%) translateX(0); }
          50% { transform: translateY(-50%) translateX(30px); }
        }

        .gradient-fade {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 150px;
          z-index: 10;
          pointer-events: none;
        }

        .gradient-fade-left {
          left: 0;
          background: linear-gradient(to right, var(--bg-primary) 0%, transparent 100%);
        }

        .gradient-fade-right {
          right: 0;
          background: linear-gradient(to left, var(--bg-primary) 0%, transparent 100%);
        }

        .carousel-container {
          overflow: hidden;
          width: 100%;
          position: relative;
          z-index: 1;
        }
        
        .carousel-track {
          display: flex;
          align-items: center;
          gap: 2.5rem;
          will-change: transform;
          padding: 2rem 0;
        }
        
        .carousel-track-1 {
          animation: scroll 50s linear infinite;
        }
        
        .carousel-track-2 {
          animation: scrollReverse 50s linear infinite;
        }
        
        .carousel-item {
          height: 380px;
          width: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          filter: brightness(0.8) saturate(0.8);
        }
        
        .carousel-item:hover {
          transform: scale(1.05) translateY(-8px);
          z-index: 20;
          filter: brightness(1) saturate(1);
        }

        .phone-frame {
          position: relative;
          width: 200px;
          height: 100%;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .phone-border {
          position: absolute;
          inset: -3px;
          border-radius: 2.75rem;
          background: linear-gradient(135deg, rgba(255, 107, 53, 0.5), rgba(168, 85, 247, 0.5));
          opacity: 0;
          transition: opacity 0.5s ease;
          animation: borderRotate 3s linear infinite;
        }

        @keyframes borderRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .carousel-item:hover .phone-border {
          opacity: 1;
        }

        .phone-inner {
          position: relative;
          background: linear-gradient(145deg, #1a1a1a 0%, #0a0a0a 100%);
          border-radius: 2.5rem;
          padding: 10px;
          box-shadow: 
            0 30px 60px rgba(0, 0, 0, 0.5),
            0 10px 20px rgba(0, 0, 0, 0.3),
            inset 0 0 0 1px rgba(255, 255, 255, 0.05);
          height: 100%;
          transition: all 0.5s ease;
        }

        .carousel-item:hover .phone-inner {
          box-shadow: 
            0 40px 80px rgba(255, 107, 53, 0.3),
            0 20px 40px rgba(168, 85, 247, 0.2),
            inset 0 0 0 1px rgba(255, 107, 53, 0.3);
        }

        .phone-notch {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 120px;
          height: 24px;
          background: #000;
          border-radius: 0 0 18px 18px;
          z-index: 10;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
        }

        .phone-notch::before {
          content: '';
          position: absolute;
          top: 8px;
          left: 50%;
          transform: translateX(-50%);
          width: 8px;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
        }
        
        .phone-screen {
          position: relative;
          border-radius: 2.2rem;
          overflow: hidden;
          height: 100%;
          background: #000;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .carousel-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
          transition: transform 0.5s ease;
        }

        .carousel-item:hover .carousel-image {
          transform: scale(1.05);
        }

        .image-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, transparent 40%);
          opacity: 0;
          transition: opacity 0.5s ease;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 1.5rem;
        }

        .carousel-item:hover .image-overlay {
          opacity: 1;
        }

        .overlay-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          background: rgba(255, 107, 53, 0.95);
          border-radius: 999px;
          font-size: 0.875rem;
          font-weight: 700;
          color: #fff;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          box-shadow: 0 4px 12px rgba(255, 107, 53, 0.4);
          animation: slideUp 0.5s ease-out;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .badge-icon {
          width: 16px;
          height: 16px;
        }
        
        @keyframes scroll {
          0% { 
            transform: translateX(0); 
          }
          100% { 
            transform: translateX(-50%);
          }
        }
        
        @keyframes scrollReverse {
          0% { 
            transform: translateX(-50%); 
          }
          100% { 
            transform: translateX(0);
          }
        }

        .carousel-controls {
          display: flex;
          justify-content: center;
          margin-top: 3rem;
          position: relative;
          z-index: 2;
        }

        .control-indicator {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1.5rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 999px;
          backdrop-filter: blur(10px);
        }

        .indicator-text {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--text-secondary);
          letter-spacing: 0.1em;
        }

        .indicator-dot {
          width: 10px;
          height: 10px;
          background: var(--accent-orange);
          border-radius: 50%;
          animation: blink 1.5s ease-in-out infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        
        @media (max-width: 768px) {
          .carousel-section {
            padding: 4rem 0;
          }

          .carousel-header {
            margin-bottom: 3rem;
          }

          .carousel-item {
            height: 320px;
          }

          .phone-frame {
            width: 180px;
          }
          
          .gradient-fade {
            width: 80px;
          }

          .carousel-glow {
            width: 300px;
            height: 300px;
          }
        }
      `}</style>
        </section>
    );
};

export default ImageCarousel;
