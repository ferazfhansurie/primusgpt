import React, { useState } from 'react';
import './Register.css';

interface RegisterFormData {
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  plan_id: string;
}

interface PricingPlan {
  id: string;
  label: string;
  price: string;
  originalPrice: string;
  perMonth?: string;
  discount?: string;
  popular?: boolean;
}

const plans: PricingPlan[] = [
  {
    id: 'monthly',
    label: 'Monthly',
    price: '29.90',
    originalPrice: '39.90',
  },
  {
    id: 'quarterly',
    label: 'Quarterly',
    price: '80.70',
    originalPrice: '107.70',
    perMonth: '26.90/mo',
    discount: '10% off',
    popular: true,
  },
  {
    id: '6-months',
    label: '6-Months',
    price: '152.50',
    originalPrice: '203.40',
    perMonth: '25.40/mo',
    discount: '15% off',
  },
  {
    id: 'annual',
    label: 'Annual',
    price: '287.00',
    originalPrice: '383.00',
    perMonth: '23.90/mo',
    discount: '20% off',
  },
];

const Register: React.FC = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    phone: '',
    first_name: '',
    last_name: '',
    plan_id: 'quarterly'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const BOT_USERNAME = import.meta.env.VITE_BOT_USERNAME || 'primusgpt_ai_bot';

  const selectedPlan = plans.find(p => p.id === formData.plan_id) || plans[1];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const validateForm = () => {
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (!formData.phone || !/^\+?[1-9]\d{6,14}$/.test(formData.phone.replace(/[\s\-()]/g, ''))) {
      setError('Please enter a valid phone number with country code (e.g., +971501234567)');
      return false;
    }

    if (!formData.first_name) {
      setError('First name is required');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    // Prepare data
    const registrationData = {
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      plan_id: formData.plan_id
    };
    
    try {
      // Create Stripe Checkout Session
      const response = await fetch(`${API_URL}/api/payment/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store registration data temporarily
        localStorage.setItem('primus_registration_pending', JSON.stringify({
          ...registrationData,
          initiated_at: new Date().toISOString()
        }));

        // Redirect directly to Stripe Checkout URL
        if (data.url) {
          window.location.href = data.url;
        } else {
          setError('Failed to get payment URL');
        }
      } else {
        setError(data.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Network error:', err);
      setError('Network error. Please check if the API server is running and try again.');
    } finally {
      setLoading(false);
    }
  };

  const openTelegram = () => {
    const email = formData.email;
    const phone = formData.phone;
    const message = encodeURIComponent(
      `/start\nEmail: ${email}\nPhone: ${phone}`
    );
    window.open(`https://t.me/${BOT_USERNAME}?text=${message}`, '_blank');
  };

  if (success) {
    return (
      <div className="register-container">
        <div className="register-card success-card">
          <div className="success-icon">✅</div>
          <h1 className="register-title">Registration Successful!</h1>
          <p className="success-message">Your payment has been processed and your account has been created.</p>
          <div className="success-steps">
            <h3>Next Steps:</h3>
            <ol>
              <li>Click the button below to open Telegram</li>
              <li>Click /start to begin</li>
              <li>The bot will recognize you automatically</li>
              <li>Start analyzing markets!</li>
            </ol>
          </div>
          <button onClick={openTelegram} className="btn btn-primary">
            <span>Open Telegram Bot</span>
          </button>
          <button 
            onClick={() => setSuccess(false)} 
            className="btn btn-outline"
          >
            <span>Register Another Account</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="sale-banner-register">
          🎉 NEW YEAR SALE 🎉
          <span className="sale-subtitle-register">Save Up To 25% - Limited Time!</span>
        </div>
        
        <h1 className="register-title">Register for <span className="text-gradient">PRIMUS GPT</span></h1>
        <p className="register-subtitle">
          Start with a 7-day free trial, then choose your subscription plan
        </p>

        {/* Plan Selection */}
        <div className="plan-selection">
          <h3>Select Your Plan:</h3>
          <div className="plan-options">
            {plans.map((plan) => (
              <button
                key={plan.id}
                type="button"
                className={`plan-option ${formData.plan_id === plan.id ? 'selected' : ''} ${plan.popular ? 'popular' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, plan_id: plan.id }))}
              >
                {plan.popular && <span className="plan-badge">Most Popular</span>}
                <div className="plan-label">{plan.label}</div>
                <div className="plan-original-price">${plan.originalPrice}</div>
                <div className="plan-price">${plan.price}</div>
                {plan.perMonth && <div className="plan-per-month">{plan.perMonth}</div>}
                {plan.discount && <div className="plan-discount">{plan.discount}</div>}
              </button>
            ))}
          </div>
          <div className="trial-info">
            🎁 <strong>7 days free trial</strong> - Cancel anytime during trial at no charge
          </div>
        </div>

        <div className="telegram-id-info">
          <h3>📱 Registration Process:</h3>
          <p className="info-note">
            After completing registration, you'll get immediate access to the Telegram bot for 7 days free. Payment starts after the trial ends.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">
              Email <span className="required">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your.email@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">
              Phone Number <span className="required">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+971501234567"
              required
            />
            <small>Include country code (e.g., +971 for UAE)</small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name">
                First Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="John"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="last_name">
                Last Name
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Doe"
              />
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary btn-submit"
            disabled={loading}
          >
            <span>{loading ? 'Processing...' : `Start 7-Day Free Trial (Then $${selectedPlan.price})`}</span>
          </button>

          <div className="payment-security">
            <span className="security-icon">🔒</span>
            <span>Secure payment powered by Stripe · Cancel anytime</span>
          </div>
        </form>

        <div className="login-link">
          Already registered? 
          <button onClick={openTelegram} className="link-button">
            Login via Telegram
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
