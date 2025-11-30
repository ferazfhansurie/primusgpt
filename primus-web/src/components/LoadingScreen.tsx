import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
    onLoadingComplete: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoadingComplete }) => {
    const [progress, setProgress] = useState(0);
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
        // Simulate loading progress
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setFadeOut(true);
                    setTimeout(() => {
                        onLoadingComplete();
                    }, 800);
                    return 100;
                }
                return prev + 2;
            });
        }, 30);

        return () => clearInterval(interval);
    }, [onLoadingComplete]);

    return (
        <div className={`loading-screen ${fadeOut ? 'fade-out' : ''}`}>
            <div className="loading-content">
                <div className="logo-container">
                    <img 
                        src="/welcome.webp" 
                        alt="Primus GPT" 
                        className="loading-logo"
                    />
                    <div className="logo-glow"></div>
                </div>
                
                <div className="loading-text">
                    <h1 className="loading-title">PRIMUS<span className="gradient-text">GPT</span></h1>
                    <p className="loading-subtitle">AI-Powered Trading Intelligence</p>
                </div>

                <div className="progress-container">
                    <div className="progress-bar">
                        <div 
                            className="progress-fill" 
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <span className="progress-text">{progress}%</span>
                </div>
            </div>

            <style>{`
                .loading-screen {
                    position: fixed;
                    inset: 0;
                    background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    opacity: 1;
                    transition: opacity 0.8s ease-out;
                }

                .loading-screen.fade-out {
                    opacity: 0;
                    pointer-events: none;
                }

                .loading-screen::before {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 800px;
                    height: 800px;
                    background: radial-gradient(circle, rgba(255, 107, 53, 0.15) 0%, transparent 70%);
                    border-radius: 50%;
                    filter: blur(100px);
                    animation: pulse 3s ease-in-out infinite;
                }

                .loading-screen::after {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 600px;
                    height: 600px;
                    background: radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, transparent 70%);
                    border-radius: 50%;
                    filter: blur(80px);
                    animation: pulse 3s ease-in-out infinite reverse;
                }

                @keyframes pulse {
                    0%, 100% { 
                        opacity: 0.6;
                        transform: translate(-50%, -50%) scale(1);
                    }
                    50% { 
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1.1);
                    }
                }

                .loading-content {
                    position: relative;
                    z-index: 2;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 2rem;
                }

                .logo-container {
                    position: relative;
                    width: 200px;
                    height: 200px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: float 3s ease-in-out infinite;
                }

                @keyframes float {
                    0%, 100% { 
                        transform: translateY(0px);
                    }
                    50% { 
                        transform: translateY(-20px);
                    }
                }

                .loading-logo {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    filter: drop-shadow(0 0 30px rgba(255, 107, 53, 0.6));
                    animation: rotate 10s linear infinite, glow 2s ease-in-out infinite;
                    position: relative;
                    z-index: 2;
                }

                @keyframes rotate {
                    0% { 
                        transform: rotate(0deg);
                    }
                    100% { 
                        transform: rotate(360deg);
                    }
                }

                @keyframes glow {
                    0%, 100% { 
                        filter: drop-shadow(0 0 30px rgba(255, 107, 53, 0.6));
                    }
                    50% { 
                        filter: drop-shadow(0 0 50px rgba(255, 107, 53, 1)) 
                                drop-shadow(0 0 80px rgba(168, 85, 247, 0.5));
                    }
                }

                .logo-glow {
                    position: absolute;
                    inset: -20px;
                    background: radial-gradient(circle, rgba(255, 107, 53, 0.3) 0%, transparent 70%);
                    border-radius: 50%;
                    filter: blur(40px);
                    animation: glowPulse 2s ease-in-out infinite;
                }

                @keyframes glowPulse {
                    0%, 100% { 
                        opacity: 0.5;
                        transform: scale(1);
                    }
                    50% { 
                        opacity: 1;
                        transform: scale(1.2);
                    }
                }

                .loading-text {
                    text-align: center;
                }

                .loading-title {
                    font-size: 3rem;
                    font-weight: 900;
                    color: #fff;
                    letter-spacing: 0.1em;
                    margin-bottom: 0.5rem;
                    text-transform: uppercase;
                    animation: slideUp 1s ease-out;
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

                .gradient-text {
                    background: linear-gradient(135deg, #ff6b35 0%, #a855f7 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .loading-subtitle {
                    font-size: 1.125rem;
                    color: rgba(255, 255, 255, 0.6);
                    font-weight: 500;
                    letter-spacing: 0.05em;
                    animation: slideUp 1s ease-out 0.2s both;
                }

                .progress-container {
                    width: 300px;
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    animation: slideUp 1s ease-out 0.4s both;
                }

                .progress-bar {
                    width: 100%;
                    height: 6px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 999px;
                    overflow: hidden;
                    position: relative;
                }

                .progress-bar::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(90deg, 
                        transparent 0%, 
                        rgba(255, 107, 53, 0.3) 50%, 
                        transparent 100%);
                    animation: shimmer 2s linear infinite;
                }

                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }

                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #ff6b35 0%, #a855f7 100%);
                    border-radius: 999px;
                    transition: width 0.3s ease;
                    position: relative;
                    box-shadow: 0 0 20px rgba(255, 107, 53, 0.6);
                }

                .progress-fill::after {
                    content: '';
                    position: absolute;
                    right: 0;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 12px;
                    height: 12px;
                    background: #fff;
                    border-radius: 50%;
                    box-shadow: 0 0 15px rgba(255, 107, 53, 0.8);
                }

                .progress-text {
                    text-align: center;
                    font-size: 1rem;
                    font-weight: 700;
                    color: rgba(255, 255, 255, 0.8);
                    letter-spacing: 0.1em;
                }

                @media (max-width: 768px) {
                    .logo-container {
                        width: 150px;
                        height: 150px;
                    }

                    .loading-title {
                        font-size: 2rem;
                    }

                    .loading-subtitle {
                        font-size: 0.9rem;
                    }

                    .progress-container {
                        width: 250px;
                    }
                }
            `}</style>
        </div>
    );
};

export default LoadingScreen;
