import React, { useState } from 'react';

type BillingCycle = 'monthly' | 'quarterly' | '6-months' | 'annual';

interface PricingPlan {
    id: BillingCycle;
    label: string;
    price: string;
    perMonth?: string;
    discount?: string;
    savings?: string;
    popular?: boolean;
}

const plans: PricingPlan[] = [
    {
        id: 'monthly',
        label: 'Monthly',
        price: '29.90',
    },
    {
        id: 'quarterly',
        label: 'Quarterly',
        price: '80.70',
        perMonth: '26.90',
        discount: '10% off',
        savings: '$9.00',
        popular: true,
    },
    {
        id: '6-months',
        label: '6-Months',
        price: '152.50',
        perMonth: '25.40',
        discount: '15% off',
        savings: '$26.90',
    },
    {
        id: 'annual',
        label: 'Annual',
        price: '287.00',
        perMonth: '23.90',
        discount: '20% off',
        savings: '$71.80',
    },
];

const features = [
    'Gold + Forex Analysis',
    'All 9 Timeframes',
    'Real-time Signals',
    'Priority Support',
    'Advanced Indicators',
    'Pattern Recognition',
];

const Pricing: React.FC = () => {
    const [selectedPlan, setSelectedPlan] = useState<BillingCycle>('quarterly');

    const activePlan = plans.find(p => p.id === selectedPlan) || plans[1];

    return (
        <section className="pricing-section">
            <div className="container">
                <div className="pricing-header">
                    <h2 className="section-title">
                        Choose Your <span className="text-gradient">PRIMUSGPT.AI</span>
                    </h2>
                    <h3 className="section-subtitle-large">Subscription Plan</h3>
                    <p className="section-subtitle">
                        Start with a 7-day free trial, then choose your preferred billing cycle
                    </p>
                </div>

                {/* Billing Cycle Tabs */}
                <div className="billing-tabs">
                    {plans.map((plan) => (
                        <button
                            key={plan.id}
                            className={`billing-tab ${selectedPlan === plan.id ? 'active' : ''}`}
                            onClick={() => setSelectedPlan(plan.id)}
                        >
                            {plan.label}
                            {plan.popular && <span className="tab-badge">Most Popular</span>}
                        </button>
                    ))}
                </div>

                {/* Pricing Card */}
                <div className="pricing-card-wrapper">
                    <div className={`pricing-card ${activePlan.popular ? 'popular' : ''}`}>
                        {activePlan.popular && (
                            <div className="popular-badge">Most Popular</div>
                        )}
                        
                        <div className="pricing-header-card">
                            <h4 className="plan-name">{activePlan.label}</h4>
                            
                            <div className="price-container">
                                <div className="price-main">
                                    <span className="currency">$</span>
                                    <span className="price">{activePlan.price}</span>
                                    <span className="period">USD</span>
                                </div>
                                
                                {activePlan.perMonth && (
                                    <div className="price-breakdown">
                                        <span className="per-month">≈ ${activePlan.perMonth}/month</span>
                                    </div>
                                )}
                            </div>

                            {activePlan.discount && (
                                <div className="savings-info">
                                    <span className="discount-badge">{activePlan.discount}</span>
                                    <span className="savings-text">Save: {activePlan.savings}</span>
                                </div>
                            )}

                            <div className="trial-badge">
                                🎁 Free for 7 days
                            </div>
                        </div>

                        <div className="features-list">
                            {features.map((feature, index) => (
                                <div key={index} className="feature-item">
                                    <svg className="check-icon" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span>{feature}</span>
                                </div>
                            ))}
                        </div>

                        <a href="/register" className="cta-button pricing-cta">
                            Start Free Trial
                            <svg className="arrow-icon" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </a>
                    </div>
                </div>

                <p className="pricing-note">
                    Cancel anytime. No questions asked. Full refund within 30 days.
                </p>
            </div>

            <style>{`
                .pricing-section {
                    padding: 8rem 0;
                    background: linear-gradient(180deg, var(--bg-primary) 0%, rgba(168, 85, 247, 0.03) 50%, var(--bg-primary) 100%);
                    position: relative;
                    overflow: hidden;
                }

                .pricing-section::before {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 600px;
                    height: 600px;
                    background: radial-gradient(circle, rgba(255, 107, 53, 0.1) 0%, transparent 70%);
                    border-radius: 50%;
                    filter: blur(100px);
                    pointer-events: none;
                }

                .pricing-header {
                    text-align: center;
                    margin-bottom: 3rem;
                    position: relative;
                    z-index: 2;
                }

                .section-subtitle-large {
                    font-size: 2rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    margin-bottom: 1rem;
                }

                .billing-tabs {
                    display: flex;
                    justify-content: center;
                    gap: 1rem;
                    margin-bottom: 4rem;
                    flex-wrap: wrap;
                    position: relative;
                    z-index: 2;
                }

                .billing-tab {
                    position: relative;
                    padding: 1rem 2rem;
                    background: rgba(255, 255, 255, 0.03);
                    border: 2px solid rgba(255, 255, 255, 0.1);
                    border-radius: 1rem;
                    color: var(--text-secondary);
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    backdrop-filter: blur(10px);
                }

                .billing-tab:hover {
                    background: rgba(255, 255, 255, 0.05);
                    border-color: rgba(255, 107, 53, 0.3);
                    transform: translateY(-2px);
                }

                .billing-tab.active {
                    background: linear-gradient(135deg, rgba(255, 107, 53, 0.2), rgba(168, 85, 247, 0.2));
                    border-color: var(--accent-orange);
                    color: var(--text-primary);
                    box-shadow: 0 8px 24px rgba(255, 107, 53, 0.3);
                }

                .tab-badge {
                    position: absolute;
                    top: -10px;
                    right: -10px;
                    padding: 0.25rem 0.75rem;
                    background: var(--accent-orange);
                    color: #fff;
                    font-size: 0.7rem;
                    font-weight: 700;
                    border-radius: 999px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    white-space: nowrap;
                }

                .pricing-card-wrapper {
                    display: flex;
                    justify-content: center;
                    margin-bottom: 2rem;
                    position: relative;
                    z-index: 2;
                }

                .pricing-card {
                    position: relative;
                    max-width: 500px;
                    width: 100%;
                    background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
                    border: 2px solid rgba(255, 255, 255, 0.1);
                    border-radius: 2rem;
                    padding: 3rem;
                    backdrop-filter: blur(20px);
                    transition: all 0.4s ease;
                }

                .pricing-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 20px 60px rgba(255, 107, 53, 0.2);
                    border-color: rgba(255, 107, 53, 0.5);
                }

                .pricing-card.popular {
                    border-color: var(--accent-orange);
                    box-shadow: 0 10px 40px rgba(255, 107, 53, 0.3);
                }

                .popular-badge {
                    position: absolute;
                    top: -15px;
                    left: 50%;
                    transform: translateX(-50%);
                    padding: 0.5rem 1.5rem;
                    background: linear-gradient(135deg, var(--accent-orange), #ff8c5f);
                    color: #fff;
                    font-size: 0.875rem;
                    font-weight: 700;
                    border-radius: 999px;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.4);
                }

                .pricing-header-card {
                    text-align: center;
                    margin-bottom: 2rem;
                    padding-bottom: 2rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }

                .plan-name {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    margin-bottom: 1.5rem;
                }

                .price-container {
                    margin-bottom: 1rem;
                }

                .price-main {
                    display: flex;
                    align-items: flex-start;
                    justify-content: center;
                    gap: 0.5rem;
                    margin-bottom: 0.5rem;
                }

                .currency {
                    font-size: 2rem;
                    font-weight: 600;
                    color: var(--accent-orange);
                    margin-top: 0.5rem;
                }

                .price {
                    font-size: 4rem;
                    font-weight: 800;
                    background: linear-gradient(135deg, var(--accent-orange), #a855f7);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    line-height: 1;
                }

                .period {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: var(--text-secondary);
                    margin-top: 0.5rem;
                }

                .price-breakdown {
                    margin-top: 0.5rem;
                }

                .per-month {
                    font-size: 1.125rem;
                    color: var(--text-secondary);
                    font-weight: 600;
                }

                .savings-info {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 1rem;
                    margin-top: 1rem;
                    padding: 0.75rem 1.5rem;
                    background: rgba(168, 85, 247, 0.1);
                    border: 1px solid rgba(168, 85, 247, 0.3);
                    border-radius: 999px;
                }

                .discount-badge {
                    font-size: 0.875rem;
                    font-weight: 700;
                    color: #a855f7;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .savings-text {
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: var(--text-secondary);
                }

                .trial-badge {
                    margin-top: 1.5rem;
                    padding: 0.75rem 1.5rem;
                    background: linear-gradient(135deg, rgba(255, 107, 53, 0.15), rgba(168, 85, 247, 0.15));
                    border: 1px solid rgba(255, 107, 53, 0.3);
                    border-radius: 999px;
                    font-size: 1rem;
                    font-weight: 700;
                    color: var(--accent-orange);
                }

                .features-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    margin-bottom: 2rem;
                }

                .feature-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-size: 1rem;
                    color: var(--text-primary);
                    font-weight: 500;
                }

                .check-icon {
                    width: 24px;
                    height: 24px;
                    color: var(--accent-orange);
                    flex-shrink: 0;
                }

                .pricing-cta {
                    width: 100%;
                    padding: 1.25rem 2rem;
                    font-size: 1.125rem;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                }

                .arrow-icon {
                    width: 20px;
                    height: 20px;
                    transition: transform 0.3s ease;
                }

                .pricing-cta:hover .arrow-icon {
                    transform: translateX(4px);
                }

                .pricing-note {
                    text-align: center;
                    font-size: 0.875rem;
                    color: var(--text-secondary);
                    margin-top: 2rem;
                    position: relative;
                    z-index: 2;
                }

                @media (max-width: 768px) {
                    .pricing-section {
                        padding: 4rem 0;
                    }

                    .section-subtitle-large {
                        font-size: 1.5rem;
                    }

                    .billing-tabs {
                        gap: 0.5rem;
                    }

                    .billing-tab {
                        padding: 0.75rem 1.25rem;
                        font-size: 0.875rem;
                    }

                    .tab-badge {
                        font-size: 0.6rem;
                        padding: 0.2rem 0.5rem;
                    }

                    .pricing-card {
                        padding: 2rem 1.5rem;
                    }

                    .price {
                        font-size: 3rem;
                    }

                    .currency {
                        font-size: 1.5rem;
                    }
                }
            `}</style>
        </section>
    );
};

export default Pricing;
